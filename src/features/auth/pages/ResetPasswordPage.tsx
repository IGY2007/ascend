import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, PasswordInput } from '@/components/ui/input'
import { newPasswordSchema, type NewPasswordInput } from '@/schemas/auth'
import { authErrorMessage, authService } from '@/services/auth'
import { t } from '@/i18n'
import { AuthLayout } from '../AuthLayout'
import { FormError } from '../FormError'
import { useAuth } from '../auth-context'

/** Se llega desde el link del mail de recuperación (con la sesión ya iniciada por Supabase). */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { clearRecovery } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) })

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null)
    try {
      await authService.updatePassword(password)
      clearRecovery()
      toast.success(t.auth.passwordUpdated)
      navigate('/', { replace: true })
    } catch (e) {
      setError(authErrorMessage(e))
    }
  })

  return (
    <AuthLayout title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field
          label={t.auth.newPassword}
          error={errors.password?.message}
          hint={t.auth.passwordHint}
        >
          {(p) => (
            <PasswordInput {...p} {...register('password')} autoComplete="new-password" autoFocus />
          )}
        </Field>
        <FormError message={error} />
        <Button type="submit" size="lg" block loading={isSubmitting}>
          {t.auth.savePassword}
        </Button>
      </form>
    </AuthLayout>
  )
}
