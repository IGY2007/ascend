import { Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useDisplayName, useProfile } from '@/features/profile/use-profile'
import { formatLongDate, t } from '@/i18n'

export function HomePage() {
  const { isLoading } = useProfile()
  const name = useDisplayName()
  const today = formatLongDate(new Date())

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-muted first-letter:uppercase">{today}</p>
        {isLoading && !name ? (
          <Skeleton className="mt-2 h-9 w-44" />
        ) : (
          <h1 className="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight">
            {t.home.greeting(name)}
          </h1>
        )}
      </header>
      <EmptyState icon={Sparkles} title={t.home.emptyTitle} description={t.home.emptyBody} />
    </>
  )
}
