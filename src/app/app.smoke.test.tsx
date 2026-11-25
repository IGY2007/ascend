import { act, render, screen } from '@testing-library/react'
import { RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { t } from '@/i18n'

type Listener = (event: AuthChangeEvent, session: Session | null) => void
const listeners: Listener[] = []

// Estos tests cubren el modo con cuentas (Supabase configurado).
vi.mock('@/lib/env', () => ({
  env: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'k',
    appUrl: 'http://localhost/',
  },
  missingEnv: [],
  isLocalMode: false,
}))

vi.mock('@/lib/supabase', () => ({
  AUTH_STORAGE_KEY: 'ascend-auth',
  supabase: {
    auth: {
      onAuthStateChange: (cb: Listener) => {
        listeners.push(cb)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: { id: 'u1', display_name: 'Julius' }, error: null }),
        }),
      }),
    }),
  },
}))

const fakeSession = {
  access_token: 'a',
  refresh_token: 'r',
  user: {
    id: 'u1',
    email: 'julius@example.com',
    user_metadata: {},
    created_at: '2026-11-01T00:00:00Z',
  },
} as unknown as Session

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

describe('app con cuentas (smoke)', () => {
  beforeEach(() => {
    vi.resetModules()
    listeners.length = 0
    localStorage.clear()
  })

  it('sin sesión, una ruta protegida lleva al login', async () => {
    await renderApp('#/workouts')
    act(() => listeners.forEach((l) => l('INITIAL_SESSION', null)))
    expect(await screen.findByRole('heading', { name: t.auth.loginTitle })).toBeInTheDocument()
  })

  it('con sesión, muestra el inicio con el nombre del perfil y la navegación', async () => {
    await renderApp('#/')
    act(() => listeners.forEach((l) => l('INITIAL_SESSION', fakeSession)))
    expect(
      await screen.findByRole('heading', { name: t.home.greeting('Julius') }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: t.nav.workouts }).length).toBeGreaterThan(0)
    expect(screen.getByText(t.home.emptyTitle)).toBeInTheDocument()
  })

  it('con sesión guardada entra al instante, sin esperar la respuesta de Supabase', async () => {
    localStorage.setItem(
      'ascend-auth',
      JSON.stringify({
        refresh_token: 'r',
        user: { id: 'u1', user_metadata: { display_name: 'Julian' } },
      }),
    )
    await renderApp('#/')
    // Ningún evento de auth: simula a supabase-js reintentando renovar el token sin red.
    expect(
      await screen.findByRole('heading', { name: t.home.greeting('Julian') }),
    ).toBeInTheDocument()
  })

  it('sin conexión y con la sesión guardada, el usuario sigue logueado', async () => {
    localStorage.setItem(
      'ascend-auth',
      JSON.stringify({
        refresh_token: 'r',
        user: { id: 'u1', user_metadata: { display_name: 'Julius' } },
      }),
    )
    await renderApp('#/profile')
    act(() => listeners.forEach((l) => l('INITIAL_SESSION', null)))
    expect(await screen.findByText(t.profile.offlineSession)).toBeInTheDocument()
  })
})
