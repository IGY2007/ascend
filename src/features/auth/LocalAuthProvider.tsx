import { useMemo, type ReactNode } from 'react'
import { AuthContext, LOCAL_USER_ID, type AuthState } from './auth-context'
import { getLocalSince, useLocalName } from '@/features/profile/local-profile'

/** Modo local: un solo usuario, siempre "logueado", sin Supabase. */
export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const name = useLocalName()
  const value = useMemo<AuthState>(
    () => ({
      status: 'authenticated',
      user: { id: LOCAL_USER_ID, email: null, createdAt: getLocalSince(), metadataName: name },
      session: null,
      isOfflineSession: false,
      isRecovery: false,
      clearRecovery: () => {},
    }),
    [name],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
