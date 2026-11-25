import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { inputClassName } from './input-styles'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputClassName, className)} {...props} />
))
Input.displayName = 'Input'

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-13', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t.common.hidePassword : t.common.showPassword}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted transition-colors hover:text-fg"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  children: (props: {
    id: string
    'aria-invalid'?: boolean
    'aria-describedby'?: string
  }) => ReactNode
}

/** Campo de formulario: etiqueta, control, ayuda y error accesibles. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-muted">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
