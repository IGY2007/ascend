import { act, fireEvent, render, screen } from '@testing-library/react'
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

describe('app en modo local (smoke)', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('entra directo al inicio, sin login', async () => {
    await renderApp('#/')
    expect(await screen.findByRole('heading', { name: t.home.greeting(null) })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: t.auth.loginTitle })).not.toBeInTheDocument()
  })

  it('las pantallas de login redirigen al inicio', async () => {
    await renderApp('#/login')
    expect(await screen.findByText(t.home.emptyTitle)).toBeInTheDocument()
  })

  it('el nombre se guarda en el dispositivo y aparece en el saludo', async () => {
    await renderApp('#/profile')
    expect(await screen.findByText(t.profile.localModeTitle)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.auth.logout })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(t.profile.nameLabel), { target: { value: '  Julian ' } })
    fireEvent.click(screen.getByRole('button', { name: t.common.save }))
    expect(localStorage.getItem('ascend-local-name')).toBe('Julian')

    act(() => {
      window.location.hash = '#/'
    })
    expect(
      await screen.findByRole('heading', { name: t.home.greeting('Julian') }),
    ).toBeInTheDocument()
  })
})
