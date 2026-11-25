import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { env } from '@/lib/env'

/** Clave de localStorage donde Supabase guarda la sesión (se usa para el modo offline). */
export const AUTH_STORAGE_KEY = 'ascend-auth'

/**
 * Cliente único de Supabase. Si faltan las variables de entorno se crea con valores de relleno
 * y la app muestra la pantalla de configuración antes de usarlo (ver MissingConfig).
 */
export const supabase = createClient<Database>(
  env.supabaseUrl || 'http://localhost:54321',
  env.supabaseAnonKey || 'missing-anon-key',
  {
    auth: {
      // PKCE: los links de los mails vuelven con ?code= en la query y no chocan con el HashRouter.
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: AUTH_STORAGE_KEY,
    },
  },
)
