import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, Input, PasswordInput } from '@/components/ui/input'
import {
  forgotPasswordSchema,
  recoveryCodeSchema,
  type ForgotPasswordInput,
  type RecoveryCodeInput,
} from '@/schemas/auth'
import { authErrorMessage, authService } from '@/services/auth'
import { t } from '@/i18n'
import { AuthLayout } from '../AuthLayout'
import { FormError } from '../FormError'
import { useAuth } from '../auth-context'

/**
 * Recuperación en dos pasos. El código de 6 dígitos existe porque en iOS el link del mail se abre
 * en Safari y no en la app instalada (que tiene su propio almacenamiento).
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState<string | null>(null)

  const footer = (
    <Link to="/login" className="font-semibold text-accent-2 hover:text-fg">
      {t.auth.backToLogin}
    </Link>
  )

  return email ? (
    <AuthLayout title={t.auth.codeTitle} subtitle={t.auth.codeSubtitle(email)} footer={footer}>
      <CodeStep email={email} />
    </AuthLayout>
  ) : (
    <AuthLayout title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle} footer={footer}>
      <EmailStep onSent={setEmail} />
    </AuthLayout>
  )
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null)
    try {
      await authService.sendPasswordReset(email)
      toast.success(t.auth.resetEmailSent)
      onSent(email)
    } catch (e) {
      setError(authErrorMessage(e))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label={t.auth.email} error={errors.email?.message}>
        {(p) => (
          <Input
            {...p}
            {...register('email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder={t.auth.emailPlaceholder}
          />
        )}
      </Field>
      <FormError message={error} />
      <Button type="submit" size="lg" block loading={isSubmitting}>
        {t.auth.sendLink}
      </Button>
    </form>
  )
}

function CodeStep({ email }: { email: string }) {
  const navigate = useNavigate()
  const { clearRecovery } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryCodeInput>({ resolver: zodResolver(recoveryCodeSchema) })

  const onSubmit = handleSubmit(async ({ code, password }) => {
    setError(null)
    try {
      await authService.verifyRecoveryCode(email, code)
      await authService.updatePassword(password)
      clearRecovery()
      toast.success(t.auth.passwordUpdated)
      navigate('/', { replace: true })
    } catch (e) {
      setError(authErrorMessage(e))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field label={t.auth.code} error={errors.code?.message}>
        {(p) => (
          <Input
            {...p}
            {...register('code')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="text-center num text-xl font-semibold tracking-[0.5em]"
          />
        )}
      </Field>
      <Field label={t.auth.newPassword} error={errors.password?.message} hint={t.auth.passwordHint}>
        {(p) => <PasswordInput {...p} {...register('password')} autoComplete="new-password" />}
      </Field>
      <FormError message={error} />
      <Button type="submit" size="lg" block loading={isSubmitting}>
        {t.auth.savePassword}
      </Button>
      <p className="text-center text-sm leading-relaxed text-subtle">{t.auth.pwaNote}</p>
    </form>
  )
}
