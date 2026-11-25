import { db } from '@/lib/db'
import { LOCAL_USER_ID } from '@/features/auth/auth-context'
import { GLOBAL_EXERCISES } from '@/data/global-exercises'
import {
  bmrMifflinStJeor,
  calculateMacros,
  kcalFromMacros,
  maintenanceKcal,
} from '@/domain/nutrition'
import { generateRoutines } from '@/domain/routine-generator'
import { bmi, bodyFatEstimate } from '@/domain/body-metrics'
import { toDateKey } from '@/domain/dates'
import type {
  BodyWeight,
  Equipment,
  Exercise,
  ExerciseType,
  MacroTargets,
  MuscleGroup,
  NutritionGoal,
  OnboardingAnswers,
  Profile,
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

export interface CustomExerciseInput {
  name: string
  primaryMuscle: MuscleGroup | null
  equipment: Equipment | null
  exerciseType: ExerciseType
}

export const exercisesService = {
  global: GLOBAL_EXERCISES,

  /** Biblioteca completa: propios primero, después los globales. */
  async all(): Promise<Exercise[]> {
    const custom = await db.exercises.orderBy('name').toArray()
    return [...custom, ...GLOBAL_EXERCISES]
  },

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
    if (missing.length) for (const e of await db.exercises.bulkGet(missing)) if (e) map.set(e.id, e)
    return map
  },

  async createCustom(input: CustomExerciseInput): Promise<Exercise> {
    const exercise: Exercise = {
      id: uuid(),
      ownerUserId: LOCAL_USER_ID,
      nameEs: null,
      ...input,
      name: input.name.trim().slice(0, 80),
    }
    await db.exercises.add(exercise)
    return exercise
  },

  async updateCustom(id: string, input: Partial<CustomExerciseInput>) {
    const patch = { ...input, ...(input.name ? { name: input.name.trim().slice(0, 80) } : {}) }
    await db.exercises.update(id, patch)
  },
}

// ---------------------------------------------------------------- métricas y plan

export interface BodyMetrics {
  bmr: number
  maintenance: number
  bmi: number
  bodyFat: number
}

export function bodyMetrics(
  profile: Pick<Profile, 'sex' | 'age' | 'heightCm' | 'activity' | 'daysPerWeek' | 'goal'>,
  weightKg: number,
): BodyMetrics {
  const input = { ...profile, weightKg, trainingDaysPerWeek: profile.daysPerWeek }
  const value = bmi(weightKg, profile.heightCm)
  return {
    bmr: Math.round(bmrMifflinStJeor(input)),
    maintenance: Math.round(maintenanceKcal(input)),
    bmi: value,
    bodyFat: bodyFatEstimate(value, profile.age, profile.sex),
  }
}

function macrosFor(
  answers: Pick<
    OnboardingAnswers,
    'sex' | 'age' | 'heightCm' | 'activity' | 'daysPerWeek' | 'goal'
  >,
  weightKg: number,
) {
  return calculateMacros({
    sex: answers.sex,
    age: answers.age,
    heightCm: answers.heightCm,
    weightKg,
    activity: answers.activity,
    trainingDaysPerWeek: answers.daysPerWeek,
    goal: answers.goal,
  })
}

export interface PlanPreview {
  macros: MacroTargets
  metrics: BodyMetrics
  routines: ReturnType<typeof generateRoutines>
}

/** Calcula macros, métricas y rutinas sin guardar nada (resumen del cuestionario). */
export function previewPlan(answers: OnboardingAnswers): PlanPreview {
  return {
    macros: macrosFor(answers, answers.weightKg),
    metrics: bodyMetrics(answers, answers.weightKg),
    routines: generateRoutines(answers, GLOBAL_EXERCISES),
  }
}

export const profileService = {
  get: () => db.profile.get('me'),

  /**
   * Guarda el cuestionario y prepara todo: perfil, objetivo de nutrición, rutinas generadas y el
   * peso de hoy. Si se rehace, reemplaza solo las rutinas generadas (las propias se mantienen) y
   * nunca toca el historial de peso ni los entrenamientos.
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

        const generated = await db.templates.filter((t) => t.source === 'generated').toArray()
        const generatedIds = generated.map((t) => t.id)
        await db.templateExercises.where('templateId').anyOf(generatedIds).delete()
        await db.templates.bulkDelete(generatedIds)
        const manual = await db.templates.orderBy('position').toArray()

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
            notes: r.notes,
            position: i,
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
        // Las generadas van primero en la rotación; las propias, después.
        await Promise.all(
          manual.map((t, i) => db.templates.update(t.id, { position: templates.length + i })),
        )
        await db.templates.bulkAdd(templates)
        await db.templateExercises.bulkAdd(items)
      },
    )
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

  /**
   * Recalcula los macros con el peso actual. Solo si el objetivo vigente salió del cuestionario:
   * si el usuario los editó a mano, se respetan.
   */
  async recalcFromWeight(weightKg: number): Promise<boolean> {
    const [profile, current] = await Promise.all([db.profile.get('me'), nutritionService.current()])
    if (!profile || current?.source === 'manual') return false
    const macros = macrosFor(profile, weightKg)
    if (current && current.kcal === macros.kcal && current.proteinG === macros.proteinG)
      return false
    const ts = now()
    await db.nutritionGoals.add({
      id: uuid(),
      userId: LOCAL_USER_ID,
      effectiveFrom: toDateKey(new Date()),
      source: 'questionnaire',
      ...macros,
      createdAt: ts,
      updatedAt: ts,
    })
    return true
  },

  /** Vuelve a los macros calculados (deja de usar los manuales). */
  async resetToCalculated(weightKg: number) {
    const profile = await db.profile.get('me')
    if (!profile) return
    const ts = now()
    await db.nutritionGoals.add({
      id: uuid(),
      userId: LOCAL_USER_ID,
      effectiveFrom: toDateKey(new Date()),
      source: 'questionnaire',
      ...macrosFor(profile, weightKg),
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

  async latest(): Promise<BodyWeight | undefined> {
    return db.bodyWeights.orderBy('date').last()
  },

  /** Un registro por día. Si es el más reciente, recalcula los macros con ese peso. */
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
    const latest = await bodyWeightService.latest()
    if (latest?.date === date) await nutritionService.recalcFromWeight(weightKg)
  },

  remove: (id: string) => db.bodyWeights.delete(id),
}

// ---------------------------------------------------------------- rutinas

export interface TemplateItem extends TemplateExercise {
  exercise: Exercise | undefined
}

export interface TemplateWithExercises extends WorkoutTemplate {
  items: TemplateItem[]
}

async function renumber(templateId: string) {
  const items = await db.templateExercises.where('templateId').equals(templateId).sortBy('position')
  await Promise.all(
    items.map((it, i) =>
      it.position === i ? null : db.templateExercises.update(it.id, { position: i }),
    ),
  )
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

  async create(name: string): Promise<string> {
    const ts = now()
    const id = uuid()
    await db.templates.add({
      id,
      userId: LOCAL_USER_ID,
      name: name.trim().slice(0, 80) || 'New Workout',
      description: null,
      weekdays: [],
      notes: null,
      position: await db.templates.count(),
      source: 'manual',
      createdAt: ts,
      updatedAt: ts,
    })
    return id
  },

  async update(
    id: string,
    patch: Partial<Pick<WorkoutTemplate, 'name' | 'description' | 'notes'>>,
  ) {
    await db.templates.update(id, { ...patch, updatedAt: now() })
  },

  async remove(id: string) {
    await db.transaction('rw', [db.templates, db.templateExercises], async () => {
      await db.templateExercises.where('templateId').equals(id).delete()
      await db.templates.delete(id)
      const rest = await db.templates.orderBy('position').toArray()
      await Promise.all(rest.map((t, i) => db.templates.update(t.id, { position: i })))
    })
  },

  async duplicate(id: string): Promise<string> {
    const ts = now()
    const tpl = await db.templates.get(id)
    if (!tpl) throw new Error('Rutina inexistente')
    const newId = uuid()
    const items = await db.templateExercises.where('templateId').equals(id).toArray()
    await db.transaction('rw', [db.templates, db.templateExercises], async () => {
      await db.templates.add({
        ...tpl,
        id: newId,
        name: `${tpl.name} (copy)`.slice(0, 80),
        source: 'manual',
        position: await db.templates.count(),
        createdAt: ts,
        updatedAt: ts,
      })
      await db.templateExercises.bulkAdd(
        items.map((it) => ({ ...it, id: uuid(), templateId: newId, createdAt: ts, updatedAt: ts })),
      )
    })
    return newId
  },

  async addExercise(templateId: string, exerciseId: string) {
    const ts = now()
    const exercise = await exercisesService.getById(exerciseId)
    const timed = exercise?.exerciseType === 'timed'
    await db.templateExercises.add({
      id: uuid(),
      userId: LOCAL_USER_ID,
      templateId,
      exerciseId,
      position: await db.templateExercises.where('templateId').equals(templateId).count(),
      targetSets: 3,
      targetRepsMin: timed ? 30 : 8,
      targetRepsMax: timed ? 60 : 12,
      targetRestSeconds: 90,
      targetRir: 2,
      notes: null,
      createdAt: ts,
      updatedAt: ts,
    })
    await db.templates.update(templateId, { updatedAt: ts })
  },

  async updateItem(
    id: string,
    patch: Partial<
      Pick<
        TemplateExercise,
        | 'exerciseId'
        | 'targetSets'
        | 'targetRepsMin'
        | 'targetRepsMax'
        | 'targetRestSeconds'
        | 'targetRir'
        | 'targetWeights'
        | 'notes'
      >
    >,
  ) {
    await db.templateExercises.update(id, { ...patch, updatedAt: now() })
  },

  async removeItem(id: string) {
    const item = await db.templateExercises.get(id)
    if (!item) return
    await db.templateExercises.delete(id)
    await renumber(item.templateId)
  },

  async moveItem(id: string, delta: -1 | 1) {
    const item = await db.templateExercises.get(id)
    if (!item) return
    const items = await db.templateExercises
      .where('templateId')
      .equals(item.templateId)
      .sortBy('position')
    const i = items.findIndex((x) => x.id === id)
    const j = i + delta
    if (j < 0 || j >= items.length) return
    await db.transaction('rw', db.templateExercises, async () => {
      await db.templateExercises.update(items[i]!.id, { position: j })
      await db.templateExercises.update(items[j]!.id, { position: i })
    })
  },

  async moveTemplate(id: string, delta: -1 | 1) {
    const all = await db.templates.orderBy('position').toArray()
    const i = all.findIndex((t) => t.id === id)
    const j = i + delta
    if (i < 0 || j < 0 || j >= all.length) return
    await db.transaction('rw', db.templates, async () => {
      await db.templates.update(all[i]!.id, { position: j })
      await db.templates.update(all[j]!.id, { position: i })
    })
  },
}

// ---------------------------------------------------------------- copia de seguridad

export const backupService = {
  /** Exporta todos los datos locales en un JSON (la red de seguridad del modo local). */
  async exportJson(): Promise<string> {
    const data = {
      app: 'ASCEND',
      version: 2,
      exportedAt: now(),
      profile: await db.profile.toArray(),
      nutritionGoals: await db.nutritionGoals.toArray(),
      bodyWeights: await db.bodyWeights.toArray(),
      exercises: await db.exercises.toArray(),
      templates: await db.templates.toArray(),
      templateExercises: await db.templateExercises.toArray(),
      sessions: await db.sessions.toArray(),
      sessionExercises: await db.sessionExercises.toArray(),
      exerciseSets: await db.exerciseSets.toArray(),
    }
    return JSON.stringify(data, null, 2)
  },
}
