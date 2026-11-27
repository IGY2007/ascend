import { AlertDialog } from 'radix-ui'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  /** Acción del botón secundario (por defecto solo cierra). */
  onCancel?: () => void
}

/** Confirmación para acciones que no se pueden deshacer (descartar, cerrar sesión, borrar). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = t.common.confirm,
  cancelLabel = t.common.cancel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] border border-border bg-bg-2 p-6 shadow-2xl outline-none data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in">
          <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-[0.95rem] leading-relaxed text-muted">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <AlertDialog.Cancel
              onClick={onCancel}
              className={buttonVariants({ variant: 'secondary' })}
            >
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className={cn(buttonVariants({ variant: destructive ? 'danger' : 'primary' }))}
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
