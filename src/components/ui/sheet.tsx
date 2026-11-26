import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  /** Se llama cada vez que el panel se abre (para reiniciar su estado interno). */
  onOpen?: () => void
}

/** Panel que sube desde abajo en móvil y se centra en desktop. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  onOpen,
}: SheetProps) {
  // Se abre desde afuera (prop `open`): Radix no avisa, así que lo detectamos acá.
  const onOpenRef = useRef(onOpen)
  useLayoutEffect(() => {
    onOpenRef.current = onOpen
  })
  useEffect(() => {
    if (open) onOpenRef.current?.()
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[1.75rem] border border-b-0 border-border bg-bg-2 pb-safe outline-none',
            'data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in',
            'md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.75rem] md:border-b md:pb-0',
            'md:data-[state=closed]:animate-dialog-out md:data-[state=open]:animate-dialog-in',
            className,
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border md:hidden" />
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-2">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted">
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label={t.common.close}
              className="-mr-2 grid size-11 place-items-center rounded-xl text-muted transition-colors hover:bg-card-2 hover:text-fg"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 pb-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
