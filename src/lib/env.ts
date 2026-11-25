/** Configuración leída de las variables de entorno de Vite (ver .env.example). */
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  /** URL pública de la app (con la ruta base), usada en los links de los mails de Supabase. */
  get appUrl() {
    return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
  },
}

/** Variables que faltan para que la app pueda funcionar. */
export const missingEnv: string[] = [
  ...(url ? [] : ['VITE_SUPABASE_URL']),
  ...(anonKey ? [] : ['VITE_SUPABASE_ANON_KEY']),
]

/**
 * Modo local (un solo usuario, sin login): se activa cuando no hay Supabase configurado.
 * Los datos quedan solo en el dispositivo. Al configurar Supabase se pasa al modo con cuentas.
 */
export const isLocalMode = missingEnv.length > 0
