import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Field, Input, PasswordInput } from '@/components/ui/input'
import { loginSchema, type LoginInput } from '@/schemas/auth'
import { authErrorMessage, authService } from '@/services/auth'
import { t } from '@/i18n'
import { AuthLayout } from '../AuthLayout'
import { FormError } from '../FormError'

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await authService.signIn(values)
      // La redirección la hace el guard al cambiar el estado de auth.
    } catch (e) {
      setError(authErrorMessage(e))
    }
  })

  return (
    <AuthLayout
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      footer={
        <>
          {t.auth.noAccount}{' '}
          <Link to="/signup" className="font-semibold text-accent-2 hover:text-fg">
            {t.auth.goSignup}
          </Link>
        </>
      }
    >
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
        <Field label={t.auth.password} error={errors.password?.message}>
          {(p) => (
            <PasswordInput {...p} {...register('password')} autoComplete="current-password" />
          )}
        </Field>
        <div className="-mt-1 flex justify-end">
          <Link to="/forgot-password" className="py-1 text-sm font-medium text-muted hover:text-fg">
            {t.auth.forgotLink}
          </Link>
        </div>
        <FormError message={error} />
        <Button type="submit" size="lg" block loading={isSubmitting}>
          {t.auth.login}
        </Button>
      </form>
    </AuthLayout>
  )
}
