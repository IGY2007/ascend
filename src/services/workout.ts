import { db } from '@/lib/db'
import { LOCAL_USER_ID } from '@/features/auth/auth-context'
import {
  compareSessions,
  detectRecords,
  isWorkingSet,
  nextInRotation,
  totalVolume,
  type PersonalRecord,
  type SessionComparison,
} from '@/domain/workout'
import type { Exercise, ExerciseSet, SessionExercise, WorkoutSession } from '@/types/models'
import { exercisesService } from './local-data'
import { fromDateKey, toDateKey } from '@/domain/dates'

/**
 * Entrenamiento activo y su historial. Todo se escribe primero en el dispositivo (Dexie): registrar
 * una serie nunca depende de la red. Cada registro tiene UUID de cliente para que la sincronización
 * futura sea un upsert idempotente.
 */
const now = () => new Date().toISOString()
const uuid = () => crypto.randomUUID()
const base = () => ({ userId: LOCAL_USER_ID, createdAt: now(), updatedAt: now() })

export interface SessionExerciseView extends SessionExercise {
  exercise: Exercise | undefined
  sets: ExerciseSet[]
  /** Series de la última vez que hizo este ejercicio (en otra sesión) */
  previous: ExerciseSet[]
}

export interface SessionView extends WorkoutSession {
  exercises: SessionExerciseView[]
}

async function lastSetsFor(exerciseId: string, excludeSessionId: string): Promise<ExerciseSet[]> {
  const ses = await db.sessionExercises.where('exerciseId').equals(exerciseId).toArray()
  if (ses.length === 0) return []
  const sessions = await db.sessions.bulkGet([...new Set(ses.map((s) => s.sessionId))])
  const done = sessions
    .filter(
      (s): s is WorkoutSession => !!s && s.status === 'completed' && s.id !== excludeSessionId,
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
  if (!done) return []
  const se = ses.filter((s) => s.sessionId === done.id).map((s) => s.id)
  return (await db.exerciseSets.where('sessionExerciseId').anyOf(se).toArray())
    .filter((s) => s.isCompleted)
    .sort((a, b) => a.setNumber - b.setNumber)
}

async function renumberSets(sessionExerciseId: string) {
  const sets = await db.exerciseSets
    .where('sessionExerciseId')
    .equals(sessionExerciseId)
    .sortBy('setNumber')
  await Promise.all(
    sets.map((s, i) =>
      s.setNumber === i + 1 ? null : db.exerciseSets.update(s.id, { setNumber: i + 1 }),
    ),
  )
}

async function createSessionExercise(
  sessionId: string,
  exercise: Exercise,
  position: number,
  targets: Partial<
    Pick<
      SessionExercise,
      'targetSets' | 'targetRepsMin' | 'targetRepsMax' | 'targetRestSeconds' | 'targetRir' | 'notes'
    >
  > & { targetWeights?: (number | null)[] } = {},
) {
  const id = uuid()
  await db.sessionExercises.add({
    id,
    ...base(),
    sessionId,
    exerciseId: exercise.id,
    exerciseNameSnapshot: exercise.name,
    position,
    targetSets: targets.targetSets ?? 3,
    targetRepsMin: targets.targetRepsMin ?? null,
    targetRepsMax: targets.targetRepsMax ?? null,
    targetRestSeconds: targets.targetRestSeconds ?? 90,
    targetRir: targets.targetRir ?? null,
    notes: targets.notes ?? null,
  })
  // Filas de series listas, precargadas con el peso de la última vez.
  const previous = await lastSetsFor(exercise.id, sessionId)
  const count = targets.targetSets ?? Math.max(previous.length, 3)
  await db.exerciseSets.bulkAdd(
    Array.from({ length: count }, (_, i) => ({
      id: uuid(),
      ...base(),
      sessionId,
      sessionExerciseId: id,
      setNumber: i + 1,
      setType: 'normal' as const,
      // Peso: el de la rutina para esa serie; si no hay, lo de la última vez.
      weightKg:
        targets.targetWeights?.[i] ?? previous[i]?.weightKg ?? previous.at(-1)?.weightKg ?? null,
      repetitions: null,
      durationSeconds: null,
      rir: null,
      isCompleted: false,
      completedAt: null,
    })),
  )
  return id
}

export const workoutService = {
  /** Sesión en curso (si cerraste la app en medio de un entrenamiento, se retoma). */
  async active(): Promise<WorkoutSession | undefined> {
    return db.sessions.where('status').equals('in_progress').first()
  },

  async startFromTemplate(templateId: string): Promise<string> {
    const existing = await workoutService.active()
    if (existing) return existing.id
    const tpl = await db.templates.get(templateId)
    if (!tpl) throw new Error('Rutina inexistente')
    const items = await db.templateExercises
      .where('templateId')
      .equals(templateId)
      .sortBy('position')
    const exercises = await exercisesService.mapByIds(items.map((i) => i.exerciseId))
    const id = uuid()
    await db.transaction('rw', [db.sessions, db.sessionExercises, db.exerciseSets], async () => {
      await db.sessions.add({
        id,
        ...base(),
        templateId,
        name: tpl.name,
        startedAt: now(),
        completedAt: null,
        durationSeconds: null,
        status: 'in_progress',
        notes: tpl.notes,
      })
      let position = 0
      for (const item of items) {
        const exercise = exercises.get(item.exerciseId)
        if (!exercise) continue
        await createSessionExercise(id, exercise, position++, item)
      }
    })
    return id
  },

  async startEmpty(name: string): Promise<string> {
    const existing = await workoutService.active()
    if (existing) return existing.id
    const id = uuid()
    await db.sessions.add({
      id,
      ...base(),
      templateId: null,
      name: name.trim() || 'Workout',
      startedAt: now(),
      completedAt: null,
      durationSeconds: null,
      status: 'in_progress',
      notes: null,
    })
    return id
  },

  async view(sessionId: string): Promise<SessionView | undefined> {
    const session = await db.sessions.get(sessionId)
    if (!session) return undefined
    const ses = await db.sessionExercises.where('sessionId').equals(sessionId).sortBy('position')
    const sets = await db.exerciseSets.where('sessionId').equals(sessionId).toArray()
    const exercises = await exercisesService.mapByIds(
      ses.map((s) => s.exerciseId).filter((x): x is string => !!x),
    )
    const views: SessionExerciseView[] = []
    for (const se of ses) {
      views.push({
        ...se,
        exercise: se.exerciseId ? exercises.get(se.exerciseId) : undefined,
        sets: sets
          .filter((s) => s.sessionExerciseId === se.id)
          .sort((a, b) => a.setNumber - b.setNumber),
        previous: se.exerciseId ? await lastSetsFor(se.exerciseId, sessionId) : [],
      })
    }
    return { ...session, exercises: views }
  },

  async addExercise(sessionId: string, exerciseId: string) {
    const exercise = await exercisesService.getById(exerciseId)
    if (!exercise) return
    const position = await db.sessionExercises.where('sessionId').equals(sessionId).count()
    await createSessionExercise(sessionId, exercise, position)
  },

  /** Cambiar el ejercicio (ej.: la máquina está ocupada). Conserva las series cargadas. */
  async replaceExercise(sessionExerciseId: string, exerciseId: string) {
    const exercise = await exercisesService.getById(exerciseId)
    if (!exercise) return
    await db.sessionExercises.update(sessionExerciseId, {
      exerciseId,
      exerciseNameSnapshot: exercise.name,
      updatedAt: now(),
    })
  },

  async removeExercise(sessionExerciseId: string) {
    await db.transaction('rw', [db.sessionExercises, db.exerciseSets], async () => {
      const se = await db.sessionExercises.get(sessionExerciseId)
      await db.exerciseSets.where('sessionExerciseId').equals(sessionExerciseId).delete()
      await db.sessionExercises.delete(sessionExerciseId)
      if (se) {
        const rest = await db.sessionExercises
          .where('sessionId')
          .equals(se.sessionId)
          .sortBy('position')
        await Promise.all(rest.map((x, i) => db.sessionExercises.update(x.id, { position: i })))
      }
    })
  },

  async updateSet(
    setId: string,
    patch: Partial<
      Pick<ExerciseSet, 'weightKg' | 'repetitions' | 'durationSeconds' | 'rir' | 'setType'>
    >,
  ) {
    await db.exerciseSets.update(setId, { ...patch, updatedAt: now() })
  },

  /** Marca o desmarca una serie como hecha. */
  async toggleSet(
    setId: string,
    values?: Partial<Pick<ExerciseSet, 'weightKg' | 'repetitions' | 'durationSeconds' | 'rir'>>,
  ) {
    const set = await db.exerciseSets.get(setId)
    if (!set) return
    const done = !set.isCompleted
    await db.exerciseSets.update(setId, {
      ...values,
      isCompleted: done,
      completedAt: done ? now() : null,
      updatedAt: now(),
    })
  },

  async addSet(sessionExerciseId: string) {
    const se = await db.sessionExercises.get(sessionExerciseId)
    if (!se) return
    const sets = await db.exerciseSets
      .where('sessionExerciseId')
      .equals(sessionExerciseId)
      .sortBy('setNumber')
    const last = sets.at(-1)
    await db.exerciseSets.add({
      id: uuid(),
      ...base(),
      sessionId: se.sessionId,
      sessionExerciseId,
      setNumber: sets.length + 1,
      setType: 'normal',
      weightKg: last?.weightKg ?? null,
      repetitions: null,
      durationSeconds: null,
      rir: null,
      isCompleted: false,
      completedAt: null,
    })
  },

  async removeSet(setId: string) {
    const set = await db.exerciseSets.get(setId)
    if (!set) return
    await db.exerciseSets.delete(setId)
    await renumberSets(set.sessionExerciseId)
  },

  async updateNotes(sessionExerciseId: string, notes: string) {
    await db.sessionExercises.update(sessionExerciseId, {
      notes: notes.trim() || null,
      updatedAt: now(),
    })
  },

  /** Termina: guarda duración, borra filas vacías no completadas y ejercicios sin series. */
  async finish(sessionId: string): Promise<void> {
    const session = await db.sessions.get(sessionId)
    if (!session) return
    const end = new Date()
    await db.transaction(
      'rw',
      [db.sessions, db.sessionExercises, db.exerciseSets, db.templateExercises],
      async () => {
        const sets = await db.exerciseSets.where('sessionId').equals(sessionId).toArray()
        await db.exerciseSets.bulkDelete(sets.filter((s) => !s.isCompleted).map((s) => s.id))

        // La rutina se actualiza con los kilos que levantaste: la próxima arrancás desde ahí.
        if (session.templateId) {
          const items = await db.templateExercises
            .where('templateId')
            .equals(session.templateId)
            .toArray()
          const sesAll = await db.sessionExercises.where('sessionId').equals(sessionId).toArray()
          for (const se of sesAll) {
            const item = items.find((it) => it.exerciseId === se.exerciseId)
            if (!item) continue
            const lifted = sets
              .filter(
                (s) => s.sessionExerciseId === se.id && s.isCompleted && s.setType === 'normal',
              )
              .sort((a, b) => a.setNumber - b.setNumber)
              .map((s) => s.weightKg)
            if (lifted.some((w) => w !== null)) {
              await db.templateExercises.update(item.id, {
                targetWeights: lifted,
                updatedAt: end.toISOString(),
              })
            }
          }
        }
        const kept = new Set(sets.filter((s) => s.isCompleted).map((s) => s.sessionExerciseId))
        const ses = await db.sessionExercises.where('sessionId').equals(sessionId).toArray()
        await db.sessionExercises.bulkDelete(ses.filter((s) => !kept.has(s.id)).map((s) => s.id))
        for (const id of kept) await renumberSets(id)
        await db.sessions.update(sessionId, {
          status: 'completed',
          completedAt: end.toISOString(),
          durationSeconds: Math.round(
            (end.getTime() - new Date(session.startedAt).getTime()) / 1000,
          ),
          updatedAt: end.toISOString(),
        })
      },
    )
  },

  /** Descarta el entrenamiento en curso (se borra del dispositivo). */
  async discard(sessionId: string) {
    await db.transaction('rw', [db.sessions, db.sessionExercises, db.exerciseSets], async () => {
      await db.exerciseSets.where('sessionId').equals(sessionId).delete()
      await db.sessionExercises.where('sessionId').equals(sessionId).delete()
      await db.sessions.delete(sessionId)
    })
  },

  async remove(sessionId: string) {
    await workoutService.discard(sessionId)
  },

  /**
   * Registra un entrenamiento de un día anterior (o de hoy, ya hecho). Queda como "completed" con las
   * series precargadas sin marcar: en la pantalla de edición se marcan las que hizo.
   */
  async logPast(date: string, templateId: string | null): Promise<string> {
    const tpl = templateId ? await db.templates.get(templateId) : undefined
    const items = tpl
      ? await db.templateExercises.where('templateId').equals(tpl.id).sortBy('position')
      : []
    const exercises = await exercisesService.mapByIds(items.map((i) => i.exerciseId))
    const start = fromDateKey(date)
    start.setHours(18, 0, 0, 0)
    const durationSeconds = 60 * 60
    const id = uuid()
    await db.transaction('rw', [db.sessions, db.sessionExercises, db.exerciseSets], async () => {
      await db.sessions.add({
        id,
        ...base(),
        templateId: tpl?.id ?? null,
        name: tpl?.name ?? 'Workout',
        startedAt: start.toISOString(),
        completedAt: new Date(start.getTime() + durationSeconds * 1000).toISOString(),
        durationSeconds,
        status: 'completed',
        notes: tpl?.notes ?? null,
      })
      let position = 0
      for (const item of items) {
        const exercise = exercises.get(item.exerciseId)
        if (exercise) await createSessionExercise(id, exercise, position++, item)
      }
    })
    return id
  },

  /**
   * Guarda la edición de un entrenamiento ya terminado: fecha y duración, y limpia las series sin
   * marcar y los ejercicios vacíos. Si no queda nada, lo borra. Devuelve si sigue existiendo.
   */
  async saveEdits(
    sessionId: string,
    patch: { date?: string; durationMinutes?: number | null } = {},
  ): Promise<boolean> {
    const session = await db.sessions.get(sessionId)
    if (!session) return false
    let alive = true
    await db.transaction('rw', [db.sessions, db.sessionExercises, db.exerciseSets], async () => {
      const sets = await db.exerciseSets.where('sessionId').equals(sessionId).toArray()
      await db.exerciseSets.bulkDelete(sets.filter((s) => !s.isCompleted).map((s) => s.id))
      const kept = new Set(sets.filter((s) => s.isCompleted).map((s) => s.sessionExerciseId))
      const ses = await db.sessionExercises.where('sessionId').equals(sessionId).sortBy('position')
      await db.sessionExercises.bulkDelete(ses.filter((s) => !kept.has(s.id)).map((s) => s.id))
      if (kept.size === 0) {
        await db.sessions.delete(sessionId)
        alive = false
        return
      }
      const survivors = ses.filter((s) => kept.has(s.id))
      for (const [i, se] of survivors.entries()) {
        if (se.position !== i) await db.sessionExercises.update(se.id, { position: i })
        await renumberSets(se.id)
      }
      const start = new Date(session.startedAt)
      if (patch.date) {
        const day = fromDateKey(patch.date)
        start.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
      }
      const durationSeconds =
        patch.durationMinutes != null
          ? Math.max(1, Math.round(patch.durationMinutes)) * 60
          : session.durationSeconds
      await db.sessions.update(sessionId, {
        startedAt: start.toISOString(),
        durationSeconds,
        completedAt: new Date(start.getTime() + (durationSeconds ?? 0) * 1000).toISOString(),
        updatedAt: now(),
      })
    })
    return alive
  },

  /** Rutina que toca en la rotación (la que sigue a la última completada). */
  async nextTemplateId(): Promise<string | null> {
    const templates = await db.templates.orderBy('position').toArray()
    const last = (await db.sessions.where('status').equals('completed').toArray())
      .filter((s) => s.templateId && templates.some((t) => t.id === s.templateId))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
    return nextInRotation(templates, last?.templateId ?? null)?.id ?? null
  },
}

// ---------------------------------------------------------------- historial y resumen

export interface SessionSummary {
  session: WorkoutSession
  exercises: number
  sets: number
  volume: number
  records: (PersonalRecord & { exerciseName: string })[]
  comparison: SessionComparison | null
}

async function summaryStats(sessionId: string) {
  const ses = await db.sessionExercises.where('sessionId').equals(sessionId).toArray()
  const sets = (await db.exerciseSets.where('sessionId').equals(sessionId).toArray()).filter(
    isWorkingSet,
  )
  const exercises = await exercisesService.mapByIds(
    ses.map((s) => s.exerciseId).filter((x): x is string => !!x),
  )
  const typeOf = (seId: string) => {
    const se = ses.find((s) => s.id === seId)
    return (se?.exerciseId && exercises.get(se.exerciseId)?.exerciseType) || 'weighted'
  }
  return {
    ses,
    sets,
    exercises,
    volume: totalVolume(sets.map((s) => ({ set: s, type: typeOf(s.sessionExerciseId) }))),
  }
}

export const historyService = {
  /** Entrenamientos terminados, del más reciente al más viejo. */
  async list(): Promise<(WorkoutSession & { volume: number; sets: number; exercises: number })[]> {
    const sessions = (await db.sessions.where('status').equals('completed').toArray()).sort(
      (a, b) => b.startedAt.localeCompare(a.startedAt),
    )
    const out = []
    for (const s of sessions) {
      const st = await summaryStats(s.id)
      out.push({
        ...s,
        volume: st.volume,
        sets: st.sets.length,
        exercises: new Set(st.sets.map((x) => x.sessionExerciseId)).size,
      })
    }
    return out
  },

  /** Entrenamientos terminados de un día (fecha local). */
  async byDate(date: string) {
    return (await historyService.list())
      .filter((s) => toDateKey(new Date(s.startedAt)) === date)
      .reverse()
  },

  async summary(sessionId: string): Promise<SessionSummary | undefined> {
    const session = await db.sessions.get(sessionId)
    if (!session) return undefined
    const st = await summaryStats(sessionId)

    // Historial previo de cada ejercicio (sesiones terminadas antes de esta)
    const current = new Map<string, ExerciseSet[]>()
    for (const set of st.sets) {
      const exId = st.ses.find((s) => s.id === set.sessionExerciseId)?.exerciseId
      if (exId) current.set(exId, [...(current.get(exId) ?? []), set])
    }
    const earlier = (await db.sessions.where('status').equals('completed').toArray()).filter(
      (s) => s.id !== sessionId && s.startedAt < session.startedAt,
    )
    const earlierIds = new Set(earlier.map((s) => s.id))
    const history = new Map<string, ExerciseSet[]>()
    for (const exId of current.keys()) {
      const ses = (await db.sessionExercises.where('exerciseId').equals(exId).toArray()).filter(
        (s) => earlierIds.has(s.sessionId),
      )
      if (ses.length)
        history.set(
          exId,
          await db.exerciseSets
            .where('sessionExerciseId')
            .anyOf(ses.map((s) => s.id))
            .toArray(),
        )
    }
    const records = detectRecords(current, history).map((r) => ({
      ...r,
      exerciseName: st.exercises.get(r.exerciseId)?.name ?? '',
    }))

    // Comparación con la sesión anterior de la misma rutina
    const prev = session.templateId
      ? earlier
          .filter((s) => s.templateId === session.templateId)
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
      : undefined
    const prevStats = prev ? await summaryStats(prev.id) : null

    return {
      session,
      exercises: new Set(st.sets.map((s) => s.sessionExerciseId)).size,
      sets: st.sets.length,
      volume: st.volume,
      records,
      comparison: compareSessions(
        { volume: st.volume, sets: st.sets.length, durationSeconds: session.durationSeconds },
        prev && prevStats
          ? {
              volume: prevStats.volume,
              sets: prevStats.sets.length,
              durationSeconds: prev.durationSeconds,
            }
          : null,
      ),
    }
  },
}
