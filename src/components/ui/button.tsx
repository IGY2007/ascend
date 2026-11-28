import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap select-none',
    'transition-[transform,opacity,background-color,border-color,color] duration-150 ease-out-soft',
    'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_24px_-8px_rgb(124_58_237/0.55)] hover:bg-[#9b70f8]',
        secondary: 'border border-border bg-card-2 text-fg hover:border-border-strong',
        ghost: 'text-muted hover:bg-card-2 hover:text-fg',
        danger: 'border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15',
        link: 'h-auto px-0 text-accent-2 hover:text-fg active:scale-100',
      },
      size: {
        sm: 'h-10 rounded-xl px-3.5 text-sm [&_svg]:size-4',
        md: 'h-12 rounded-[var(--radius-field)] px-5 text-[0.95rem] [&_svg]:size-[18px]',
        lg: 'h-14 rounded-2xl px-6 text-base [&_svg]:size-5',
        icon: 'size-11 rounded-xl [&_svg]:size-5',
      },
      block: { true: 'w-full' },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, asChild, loading, disabled, children, type, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot.Root : 'button'
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants }
