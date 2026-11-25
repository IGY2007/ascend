import { Toaster as Sonner } from 'sonner'

/** Toasts discretos, arriba en móvil (no tapan la barra inferior ni el pulgar). */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      offset={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
      mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-2xl border border-border bg-card-2/95 px-4 py-3.5 text-[0.95rem] text-fg shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl',
          title: 'font-medium',
          description: 'text-sm text-muted',
          icon: '[&_svg]:size-5',
          success: '[&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-danger',
          actionButton:
            'ml-auto h-9 shrink-0 rounded-xl bg-accent px-3.5 text-sm font-semibold text-accent-fg active:scale-[0.97] transition-transform',
        },
      }}
    />
  )
}
