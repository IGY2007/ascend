import { fireEvent, render, screen, within } from '@testing-library/react'
import { RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { t } from '@/i18n'

// Modo local: sin variables de Supabase. La app nunca debe tocar la red de Supabase.
vi.mock('@/lib/supabase', () => ({
  AUTH_STORAGE_KEY: 'ascend-auth',
  supabase: new Proxy(
    {},
    {
      get: () => {
        throw new Error('Supabase no se usa en modo local')
      },
    },
  ),
}))

async function renderApp(path: string) {
  window.location.hash = path
  const { router } = await import('./router')
  const { Providers } = await import('./providers')
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  )
}

const o = t.onboarding

describe('app en modo local', () => {
  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    const { db } = await import('@/lib/db')
    await db.delete()
    await db.open()
  })

  it('la primera vez manda al cuestionario', async () => {
    await renderApp('#/')
    expect(await screen.findByRole('heading', { name: o.welcomeTitle })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: t.auth.loginTitle })).not.toBeInTheDocument()
  })

  it('completar el cuestionario arma el plan y lleva al inicio', async () => {
    await renderApp('#/onboarding')
    const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
    const radio = async (name: string) =>
      fireEvent.click(await screen.findByRole('radio', { name: new RegExp(name) }))
    const heading = (name: string) => screen.findByRole('heading', { name })

    fireEvent.click(await screen.findByRole('button', { name: o.start }))
    await heading(o.nameQ)
    fireEvent.change(screen.getByRole('textbox', { name: o.nameQ }), {
      target: { value: 'Julian' },
    })
    click(o.next)

    await heading(o.sexQ)
    await radio(t.labels.sex.male)

    await heading(o.bodyQ)
    const [age, height, weight] = screen.getAllByRole('textbox')
    fireEvent.change(age!, { target: { value: '25' } })
    fireEvent.change(height!, { target: { value: '178' } })
    fireEvent.change(weight!, { target: { value: '75,5' } })
    click(o.next)

    await heading(o.goalQ)
    await radio(t.labels.goal.muscle)
    await heading(o.targetQ)
    click(o.skip)
    await heading(o.activityQ)
    await radio(t.labels.activity.sedentary)
    await heading(o.experienceQ)
    await radio(t.labels.experience.intermediate)

    await heading(o.daysQ)
    for (const d of ['lunes', 'martes', 'jueves', 'viernes']) click(d)
    click(o.next)

    await heading(o.durationQ)
    await radio(o.minutes(60))
    await heading(o.placeQ)
    await radio(t.labels.place.gym)

    await heading(o.summaryTitle)
    expect(screen.getByText('Upper A')).toBeInTheDocument()
    expect(screen.getByText('Lower B')).toBeInTheDocument()
    click(o.createPlan)

    expect(
      await screen.findByRole('heading', { name: t.home.greeting('Julian') }, { timeout: 3000 }),
    ).toBeInTheDocument()
    // Peso inicial registrado con coma decimal
    const { db } = await import('@/lib/db')
    expect((await db.bodyWeights.toArray()).map((w) => w.weightKg)).toEqual([75.5])
    expect(await db.templates.count()).toBe(4)
  }, 15000)

  it('con el plan hecho, Entrenar muestra las rutinas y su detalle', async () => {
    const { profileService } = await import('@/services/local-data')
    await profileService.completeOnboarding({
      name: 'Julian',
      sex: 'male',
      age: 25,
      heightCm: 178,
      weightKg: 75,
      goal: 'muscle',
      targetWeightKg: null,
      activity: 'sedentary',
      experience: 'intermediate',
      trainingDays: [1, 3, 5],
      sessionMinutes: 45,
      place: 'home',
    })
    await renderApp('#/workouts')
    fireEvent.click(await screen.findByText('Full Body A'))
    const first = await screen.findByText('Sentadilla goblet')
    const list = first.closest('ol')!
    expect(within(list).getAllByRole('listitem')).toHaveLength(4) // 45 min → 4 ejercicios
  })
})
