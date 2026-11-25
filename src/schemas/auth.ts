import { z } from 'zod'
import { t } from '@/i18n'

const v = t.validation

export const emailSchema = z.string().trim().min(1, v.required).email(v.email)
const passwordSchema = z.string().min(8, v.passwordMin).max(72, v.passwordMax)

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, v.required),
})

export const signupSchema = z.object({
  displayName: z.string().trim().min(1, v.required).max(60, v.nameMax),
  email: emailSchema,
  password: passwordSchema,
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const recoveryCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, v.code),
  password: passwordSchema,
})

export const newPasswordSchema = z.object({ password: passwordSchema })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type RecoveryCodeInput = z.infer<typeof recoveryCodeSchema>
export type NewPasswordInput = z.infer<typeof newPasswordSchema>
