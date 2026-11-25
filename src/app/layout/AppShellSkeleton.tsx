import { Skeleton } from '@/components/ui/skeleton'

/** Mientras se resuelve la sesión: el esqueleto de la app, nunca un spinner. */
export function AppShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-safe md:pl-68">
      <div className="space-y-3 pt-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="mt-8 h-44 w-full rounded-[var(--radius-card)]" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-[var(--radius-card)]" />
        <Skeleton className="h-24 rounded-[var(--radius-card)]" />
      </div>
    </div>
  )
}
