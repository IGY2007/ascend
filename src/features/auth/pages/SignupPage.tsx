import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, PasswordInput } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { signupSchema, type SignupInput } from '@/schemas/auth'
import { authErrorMessage, authService } from '@/services/auth'
import { t } from '@/i18n'
import { AuthLayout } from '../AuthLayout'
import { FormError } from '../FormError'

export function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      const signedIn = await authService.signUp(values)
      if (!signedIn) setNeedsConfirmation(true)
    } catch (e) {
      setError(authErrorMessage(e))
    }
  })

  const footer = (
    <>
      {t.auth.haveAccount}{' '}
      <Link to="/login" className="font-semibold text-accent-2 hover:text-fg">
        {t.auth.goLogin}
      </Link>
    </>
  )

  if (needsConfirmation) {
    return (
      <AuthLayout title={t.auth.codeTitle} subtitle={t.auth.signupCheckEmail} footer={footer}>
        <EmptyState
          icon={MailCheck}
          title={t.auth.codeTitle}
          description={t.auth.signupCheckEmail}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle} footer={footer}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label={t.auth.displayName} error={errors.displayName?.message}>
          {(p) => (
            <Input
              {...p}
              {...register('displayName')}
              autoComplete="given-name"
              placeholder={t.auth.displayNamePlaceholder}
            />
          )}
        </Field>
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
        <Field label={t.auth.password} error={errors.password?.message} hint={t.auth.passwordHint}>
          {(p) => <PasswordInput {...p} {...register('password')} autoComplete="new-password" />}
        </Field>
        <FormError message={error} />
        <Button type="submit" size="lg" block loading={isSubmitting}>
          {t.auth.signup}
        </Button>
      </form>
    </AuthLayout>
  )
}
