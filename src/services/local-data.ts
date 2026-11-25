import { db } from '@/lib/db'
import { LOCAL_USER_ID } from '@/features/auth/auth-context'
import { GLOBAL_EXERCISES } from '@/data/global-exercises'
import { calculateMacros, kcalFromMacros } from '@/domain/nutrition'
import { generateRoutines } from '@/domain/routine-generator'
import { toDateKey } from '@/domain/dates'
import type {
  BodyWeight,
  Exercise,
  MacroTargets,
  NutritionGoal,
  OnboardingAnswers,
  TemplateExercise,
  WorkoutTemplate,
} from '@/types/models'

/**
 * Acceso a los datos locales (Dexie). Sin JSX: lo usan los hooks de cada feature.
 * userId es el del modo local; al activar cuentas se reasigna al usuario real.
 */
const now = () => new Date().toISOString()
const uuid = () => crypto.randomUUID()

// ---------------------------------------------------------------- ejercicios

const globalById = new Map(GLOBAL_EXERCISES.map((e) => [e.id, e]))

export const exercisesService = {
  global: GLOBAL_EXERCISES,
  async getById(id: string): Promise<Exercise | undefined> {
    return globalById.get(id) ?? (await db.exercises.get(id))
  },
  async mapByIds(ids: string[]): Promise<Map<string, Exercise>> {
    const map = new Map<string, Exercise>()
    const missing: string[] = []
    for (const id of ids) {
      const g = globalById.get(id)
      if (g) map.set(id, g)
      else missing.push(id)
    }
    if (missing.length) {
      for (const e of await db.exercises.bulkGet(missing)) if (e) map.set(e.id, e)
    }
    return map
  },
}

// ---------------------------------------------------------------- perfil + cuestionario

export interface PlanPreview {
  macros: MacroTargets
  routines: ReturnType<typeof generateRoutines>
}

/** Calcula macros y rutinas sin guardar nada (para mostrar el resumen del cuestionario). */
export function previewPlan(answers: OnboardingAnswers): PlanPreview {
  return {
    macros: calculateMacros({
      sex: answers.sex,
      age: answers.age,
      heightCm: answers.heightCm,
      weightKg: answers.weightKg,
      activity: answers.activity,
      trainingDaysPerWeek: answers.trainingDays.length,
      goal: answers.goal,
    }),
    routines: generateRoutines(answers, GLOBAL_EXERCISES),
  }
}

export const profileService = {
  get: () => db.profile.get('me'),

  /**
   * Guarda el cuestionario y prepara todo: perfil, objetivo de nutrición, rutinas generadas y el
   * peso inicial. Si se rehace el cuestionario, reemplaza solo las rutinas generadas
   * automáticamente (las creadas a mano se mantienen) y nunca toca el historial de peso.
   */
  async completeOnboarding(answers: OnboardingAnswers): Promise<void> {
    const plan = previewPlan(answers)
    const ts = now()
    const today = toDateKey(new Date())

    await db.transaction(
      'rw',
      [db.profile, db.nutritionGoals, db.bodyWeights, db.templates, db.templateExercises],
      async () => {
        await db.profile.put({
          ...answers,
          id: 'me',
          userId: LOCAL_USER_ID,
          completedAt: ts,
          updatedAt: ts,
        })

        await db.nutritionGoals.put({
          id: uuid(),
          userId: LOCAL_USER_ID,
          effectiveFrom: today,
          source: 'questionnaire',
          ...plan.macros,
          createdAt: ts,
          updatedAt: ts,
        })

        // Peso de hoy: actualiza el registro del día o crea uno nuevo.
        const existing = await db.bodyWeights.where('date').equals(today).first()
        if (existing)
          await db.bodyWeights.update(existing.id, { weightKg: answers.weightKg, updatedAt: ts })
        else
          await db.bodyWeights.add({
            id: uuid(),
            userId: LOCAL_USER_ID,
            date: today,
            weightKg: answers.weightKg,
            createdAt: ts,
            updatedAt: ts,
          })

        // Reemplaza las rutinas generadas antes; conserva las manuales.
        const generated = await db.templates.filter((t) => t.source === 'generated').toArray()
        const generatedIds = generated.map((t) => t.id)
        await db.templateExercises.where('templateId').anyOf(generatedIds).delete()
        await db.templates.bulkDelete(generatedIds)
        const manualCount = await db.templates.count()

        const templates: WorkoutTemplate[] = []
        const items: TemplateExercise[] = []
        plan.routines.forEach((r, i) => {
          const templateId = uuid()
          templates.push({
            id: templateId,
            userId: LOCAL_USER_ID,
            name: r.name,
            description: r.description,
            weekdays: r.weekdays,
            notes: null,
            position: manualCount + i,
            source: 'generated',
            createdAt: ts,
            updatedAt: ts,
          })
          r.exercises.forEach((e, position) =>
            items.push({
              id: uuid(),
              userId: LOCAL_USER_ID,
              templateId,
              exerciseId: e.exerciseId,
              position,
              targetSets: e.sets,
              targetRepsMin: e.repsMin,
              targetRepsMax: e.repsMax,
              targetRestSeconds: e.restSeconds,
              targetRir: e.rir,
              notes: null,
              createdAt: ts,
              updatedAt: ts,
            }),
          )
        })
        await db.templates.bulkAdd(templates)
        await db.templateExercises.bulkAdd(items)
      },
    )
  },

  async updateName(name: string) {
    await db.profile.update('me', { name: name.trim().slice(0, 60), updatedAt: now() })
  },
}

// ---------------------------------------------------------------- nutrición

export const nutritionService = {
  /** Objetivo vigente: el de fecha más reciente (y, a igual fecha, el último creado). */
  async current(): Promise<NutritionGoal | undefined> {
    const all = await db.nutritionGoals.toArray()
    return all.sort(
      (a, b) =>
        b.effectiveFrom.localeCompare(a.effectiveFrom) || b.createdAt.localeCompare(a.createdAt),
    )[0]
  },

  /** Guarda macros editados a mano. Las calorías se calculan de los macros. */
  async setManual(macros: Omit<MacroTargets, 'kcal'>) {
    const ts = now()
    await db.nutritionGoals.add({
      id: uuid(),
      userId: LOCAL_USER_ID,
      effectiveFrom: toDateKey(new Date()),
      source: 'manual',
      ...macros,
      kcal: kcalFromMacros(macros),
      createdAt: ts,
      updatedAt: ts,
    })
  },
}

// ---------------------------------------------------------------- peso corporal

export const bodyWeightService = {
  /** Todos los registros, del más reciente al más viejo. */
  async list(): Promise<BodyWeight[]> {
    return (await db.bodyWeights.orderBy('date').toArray()).reverse()
  },

  /** Un registro por día: si ya hay uno en esa fecha, lo reemplaza. */
  async log(weightKg: number, date = toDateKey(new Date())) {
    const ts = now()
    const existing = await db.bodyWeights.where('date').equals(date).first()
    if (existing) await db.bodyWeights.update(existing.id, { weightKg, updatedAt: ts })
    else
      await db.bodyWeights.add({
        id: uuid(),
        userId: LOCAL_USER_ID,
        date,
        weightKg,
        createdAt: ts,
        updatedAt: ts,
      })
  },

  remove: (id: string) => db.bodyWeights.delete(id),
}

// ---------------------------------------------------------------- rutinas

export interface TemplateWithExercises extends WorkoutTemplate {
  items: (TemplateExercise & { exercise: Exercise | undefined })[]
}

export const templatesService = {
  async list(): Promise<TemplateWithExercises[]> {
    const templates = await db.templates.orderBy('position').toArray()
    const items = await db.templateExercises.toArray()
    const exercises = await exercisesService.mapByIds([...new Set(items.map((i) => i.exerciseId))])
    return templates.map((t) => ({
      ...t,
      items: items
        .filter((i) => i.templateId === t.id)
        .sort((a, b) => a.position - b.position)
        .map((i) => ({ ...i, exercise: exercises.get(i.exerciseId) })),
    }))
  },
}

// ---------------------------------------------------------------- copia de seguridad

export const backupService = {
  /** Exporta todos los datos locales en un JSON (la red de seguridad del modo local). */
  async exportJson(): Promise<string> {
    const data = {
      app: 'ASCEND',
      version: 1,
      exportedAt: now(),
      profile: await db.profile.toArray(),
      nutritionGoals: await db.nutritionGoals.toArray(),
      bodyWeights: await db.bodyWeights.toArray(),
      exercises: await db.exercises.toArray(),
      templates: await db.templates.toArray(),
      templateExercises: await db.templateExercises.toArray(),
    }
    return JSON.stringify(data, null, 2)
  },
}
