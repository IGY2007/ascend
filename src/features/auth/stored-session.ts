/**
 * Lectura de la sesión que Supabase guarda en localStorage.
 *
 * Sin conexión, el access token (1 h) no se puede renovar y supabase-js puede informar que no hay
 * sesión aunque siga guardada. Supabase solo borra lo guardado ante errores definitivos (token
 * revocado, logout), así que si la sesión sigue en el storage el usuario sigue logueado: la app
 * funciona localmente y la sincronización espera a que vuelva la red.
 */
export interface StoredUser {
  id: string
  email?: string
  created_at?: string
  user_metadata?: Record<string, unknown>
}

export function parseStoredUser(raw: string | null): StoredUser | null {
  if (!raw) return null
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const session = data as { refresh_token?: unknown; user?: unknown }
    if (typeof session.refresh_token !== 'string' || !session.refresh_token) return null
    const user = session.user as StoredUser | undefined
    if (!user || typeof user.id !== 'string' || !user.id) return null
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      user_metadata: user.user_metadata,
    }
  } catch {
    return null
  }
}
