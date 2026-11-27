import { describe, expect, it } from 'vitest'
import {
  achievements,
  bestWeekStreak,
  completedChallenges,
  laggingStat,
  levelFromXp,
  monthRecap,
  muscleStats,
  totalXp,
  totalsOf,
  volumeEquivalent,
  weeklyChallenges,
  xpToNext,
  type Facts,
} from './gamification'

const empty: Facts = {
  sessions: [],
  prs: [],
  exerciseSets: [],
  cardio: [],
  waterGoalDays: [],
  weightLogs: [],
  weekGoal: 3,
}

const session = (date: string, sets = 15, volume = 5000) => ({
  id: date,
  date,
  sets,
  volume,
  durationSeconds: 3600,
})

describe('niveles', () => {
  it('cada nivel pide un poco más de XP', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, into: 0, needed: 250, title: 'rookie' })
    expect(levelFromXp(249).level).toBe(1)
    expect(levelFromXp(250)).toMatchObject({ level: 2, into: 0, needed: xpToNext(2) })
    // 250 + 400 + 550 + 700 = 1900 → nivel 5
    expect(levelFromXp(1900)).toMatchObject({ level: 5, title: 'grinder' })
  })

  it('el XP sale de los datos reales', () => {
    const f: Facts = {
      ...empty,
      sessions: [session('2026-11-02'), session('2026-11-04')],
      prs: [{ date: '2026-11-04', exerciseId: 'x' }],
      waterGoalDays: ['2026-11-02'],
    }
    const xp = totalXp(f, 0)
    expect(xp.workouts).toBe(100)
    expect(xp.sets).toBe(150)
    expect(xp.prs).toBe(100)
    // El agua ya no suma XP (se sacó el registro de agua)
    expect(xp.total).toBe(350)
  })
})

describe('rachas y logros', () => {
  it('cuenta semanas seguidas cumpliendo la meta', () => {
    const f: Facts = {
      ...empty,
      weekGoal: 2,
      sessions: [
        session('2026-11-02'),
        session('2026-11-03'),
        session('2026-11-09'),
        session('2026-11-11'),
        // semana del 16 sin cumplir, después una suelta
        session('2026-11-23'),
        session('2026-11-24'),
      ],
    }
    expect(bestWeekStreak(f)).toBe(2)
  })

  it('desbloquea y muestra el avance de los logros', () => {
    const f: Facts = { ...empty, sessions: [session('2026-11-02')] }
    const list = achievements(totalsOf(f))
    expect(list.find((a) => a.def.id === 'first_workout')!.unlocked).toBe(true)
    const ten = list.find((a) => a.def.id === 'workouts_10')!
    expect(ten.unlocked).toBe(false)
    expect(ten.progress).toBeCloseTo(0.1)
  })
})

describe('desafíos semanales', () => {
  it('siempre incluye los días de entrenamiento y rota el resto', () => {
    const a = weeklyChallenges(empty, '2026-11-23')
    const b = weeklyChallenges(empty, '2026-11-30')
    expect(a).toHaveLength(3)
    expect(a[0]!.kind).toBe('train_days')
    expect(a.map((c) => c.kind)).not.toEqual(b.map((c) => c.kind))
  })

  it('mide el avance de la semana y cuenta los cumplidos', () => {
    const f: Facts = {
      ...empty,
      weekGoal: 2,
      sessions: [session('2026-11-23'), session('2026-11-25')],
    }
    const train = weeklyChallenges(f, '2026-11-23')[0]!
    expect(train).toMatchObject({ value: 2, target: 2, done: true })
    expect(completedChallenges(f, '2026-11-25')).toBeGreaterThanOrEqual(1)
  })
})

describe('músculos', () => {
  it('sube de nivel con las series y sabe si está recuperado', () => {
    const f: Facts = {
      ...empty,
      exerciseSets: [
        {
          date: '2026-11-24',
          exerciseId: 'bench',
          muscle: 'chest',
          sets: 20,
          bestE1rm: 90,
          maxWeight: 70,
        },
        {
          date: '2026-11-10',
          exerciseId: 'squat',
          muscle: 'quads',
          sets: 4,
          bestE1rm: 100,
          maxWeight: 80,
        },
      ],
    }
    const stats = muscleStats(f, '2026-11-25')
    const chest = stats.find((s) => s.stat === 'chest')!
    expect(chest.level).toBe(3) // 16 ≤ 20 < 36
    expect(chest.readiness).toBe('recovering')
    expect(stats.find((s) => s.stat === 'legs')!.readiness).toBe('cold')
    expect(stats.find((s) => s.stat === 'back')!.readiness).toBe('untrained')
    expect(laggingStat(stats)?.sets).toBe(0)
  })
})

describe('resumen del mes', () => {
  it('suma el mes y elige el mejor levantamiento', () => {
    const f: Facts = {
      ...empty,
      sessions: [session('2026-11-02', 10, 3000), session('2026-10-30', 10, 9999)],
      exerciseSets: [
        {
          date: '2026-11-02',
          exerciseId: 'bench',
          muscle: 'chest',
          sets: 6,
          bestE1rm: 90,
          maxWeight: 70,
        },
        {
          date: '2026-11-02',
          exerciseId: 'row',
          muscle: 'back',
          sets: 4,
          bestE1rm: 95,
          maxWeight: 75,
        },
      ],
    }
    const r = monthRecap(f, 2026, 10)
    expect(r.workouts).toBe(1)
    expect(r.volume).toBe(3000)
    expect(r.topExerciseId).toBe('bench')
    expect(r.bestLift).toEqual({ exerciseId: 'row', e1rm: 95 })
    expect(volumeEquivalent(3000)).toEqual({ thing: 'car', count: 2 })
    expect(volumeEquivalent(100)).toBeNull()
  })
})
