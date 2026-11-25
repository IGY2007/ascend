import { AuthError, isAuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { env } from '@/lib/env'
import { t } from '@/i18n'
import type { LoginInput, SignupInput } from '@/schemas/auth'

/** Acceso a Supabase Auth. Sin JSX: lo consumen los hooks y las pantallas. */
export const authService = {
  async signIn({ email, password }: LoginInput) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  /** Devuelve true si la cuenta quedó con sesión iniciada, false si hay que confirmar el mail. */
  async signUp({ displayName, email, password }: SignupInput) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName }, emailRedirectTo: env.appUrl },
    })
    if (error) throw error
    // Supabase no avisa si el email ya existe cuando la confirmación está activa:
    // devuelve un usuario sin identidades.
    if (data.user && data.user.identities?.length === 0) {
      throw new AuthError('User already registered', 400, 'user_already_exists')
    }
    return Boolean(data.session)
  },

  async signOut() {
    // scope local: cierra la sesión en este dispositivo aunque no haya red.
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: env.appUrl })
    if (error) throw error
  },

  /** Verifica el código de 6 dígitos del mail de recuperación (útil en la PWA instalada). */
  async verifyRecoveryCode(email: string, code: string) {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' })
    if (error) throw error
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },
}

/** Traduce los errores de Supabase Auth a mensajes en español. */
export function authErrorMessage(error: unknown): string {
  const e = t.auth.errors
  if (
    isAuthRetryableFetchError(error) ||
    (error instanceof TypeError && /fetch/i.test(error.message))
  ) {
    return e.network
  }
  if (error instanceof AuthError || isAuthApiError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return e.invalidCredentials
      case 'email_not_confirmed':
        return e.emailNotConfirmed
      case 'user_already_exists':
      case 'email_exists':
        return e.userExists
      case 'weak_password':
        return e.weakPassword
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return e.rateLimit
      case 'otp_expired':
      case 'otp_disabled':
        return e.invalidCode
      case 'same_password':
        return e.samePassword
    }
    if (error.status === 429) return e.rateLimit
  }
  return e.unknown
}
