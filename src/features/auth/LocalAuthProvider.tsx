import { useMemo, type ReactNode } from 'react'
import { AuthContext, LOCAL_USER_ID, type AuthState } from './auth-context'
import { useLocalProfile } from '@/features/profile/hooks'

/** Modo local: un solo usuario, siempre "logueado", sin Supabase. El nombre sale del perfil local. */
export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const profile = useLocalProfile()
  const value = useMemo<AuthState>(
    () => ({
      status: 'authenticated',
      user: {
        id: LOCAL_USER_ID,
        email: null,
        createdAt: profile?.completedAt ?? null,
        metadataName: profile?.name ?? null,
      },
      session: null,
      isOfflineSession: false,
      isRecovery: false,
      clearRecovery: () => {},
    }),
    [profile],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
