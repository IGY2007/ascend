import { forwardRef, useEffect, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { formatDecimal, parseDecimal, parseInteger } from '@/domain/numbers'
import { inputClassName } from './input-styles'

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
> {
  value: number | null
  onValueChange: (value: number | null) => void
  /** decimal: peso (acepta coma y punto). integer: reps, RIR. */
  kind?: 'decimal' | 'integer'
}

/**
 * Input numérico pensado para iOS: abre el teclado numérico correcto, no hace zoom (16px)
 * y acepta coma o punto como separador decimal.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onValueChange, kind = 'decimal', className, onBlur, ...props }, ref) => {
    const format = (v: number | null) =>
      v === null ? '' : kind === 'decimal' ? formatDecimal(v) : String(v)
    const [text, setText] = useState(() => format(value))

    // Sincroniza cuando el valor cambia desde afuera (ej.: botones +/-), sin pisar lo que se escribe.
    useEffect(() => {
      const parsed = kind === 'decimal' ? parseDecimal(text) : parseInteger(text)
      if (parsed !== value) setText(format(value))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
      <input
        ref={ref}
        type="text"
        inputMode={kind === 'decimal' ? 'decimal' : 'numeric'}
        pattern={kind === 'integer' ? '[0-9]*' : undefined}
        autoComplete="off"
        enterKeyHint="next"
        value={text}
        onChange={(e) => {
          const next = e.target.value
          const allowed = kind === 'decimal' ? /^\d*[.,]?\d*$/ : /^\d*$/
          if (!allowed.test(next)) return
          setText(next)
          onValueChange(kind === 'decimal' ? parseDecimal(next) : parseInteger(next))
        }}
        onBlur={(e) => {
          setText(format(value))
          onBlur?.(e)
        }}
        className={cn(inputClassName, 'text-center num font-semibold', className)}
        {...props}
      />
    )
  },
)
NumberInput.displayName = 'NumberInput'
