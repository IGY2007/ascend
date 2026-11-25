import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AUTH_STORAGE_KEY, supabase } from '@/lib/supabase'
import { t } from '@/i18n'
import { AuthContext, type AuthState, type AuthUser } from './auth-context'
import { parseStoredUser, type StoredUser } from './stored-session'

function toAuthUser(user: Session['user'] | StoredUser): AuthUser {
  const name = user.user_metadata?.display_name
  return {
    id: user.id,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    metadataName: typeof name === 'string' && name.trim() ? name.trim() : null,
  }
}

interface InternalState {
  status: AuthState['status']
  user: AuthUser | null
  session: Session | null
  isOfflineSession: boolean
}

// Se captura antes de que supabase-js limpie la URL al canjear el código PKCE.
const initialUrlHadCode =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code')

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<InternalState>({
    status: 'loading',
    user: null,
    session: null,
    isOfflineSession: false,
  })
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    // Importante: el callback no hace llamadas a Supabase (puede bloquear el cliente de auth).
    const handle = (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)

      if (session) {
        setState({
          status: 'authenticated',
          user: toAuthUser(session.user),
          session,
          isOfflineSession: false,
        })
        return
      }

      if (event === 'SIGNED_OUT') {
        queryClient.clear()
        setIsRecovery(false)
        setState({ status: 'unauthenticated', user: null, session: null, isOfflineSession: false })
        return
      }

      // Sin sesión en memoria: si sigue guardada, el usuario sigue logueado (modo sin conexión).
      const stored = parseStoredUser(localStorage.getItem(AUTH_STORAGE_KEY))
      if (stored) {
        setState({
          status: 'authenticated',
          user: toAuthUser(stored),
          session: null,
          isOfflineSession: true,
        })
      } else {
        setState({ status: 'unauthenticated', user: null, session: null, isOfflineSession: false })
        if (event === 'INITIAL_SESSION' && initialUrlHadCode) {
          // El link del mail se abrió en un navegador distinto al que pidió el código (PKCE).
          toast.error(t.auth.linkOpenedElsewhere, { duration: 8000 })
          const url = new URL(window.location.href)
          url.searchParams.delete('code')
          window.history.replaceState(window.history.state, '', url.toString())
        }
      }
    }

    const { data } = supabase.auth.onAuthStateChange(handle)

    // Al volver la conexión, se intenta recuperar una sesión válida.
    const onOnline = () => {
      void supabase.auth.getSession()
    }
    window.addEventListener('online', onOnline)

    return () => {
      data.subscription.unsubscribe()
      window.removeEventListener('online', onOnline)
    }
  }, [queryClient])

  const value = useMemo<AuthState>(
    () => ({ ...state, isRecovery, clearRecovery: () => setIsRecovery(false) }),
    [state, isRecovery],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
