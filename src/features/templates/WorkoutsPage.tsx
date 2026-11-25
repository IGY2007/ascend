import { ListChecks } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { t } from '@/i18n'

export function WorkoutsPage() {
  return (
    <>
      <PageHeader title={t.workouts.title} subtitle={t.workouts.subtitle} />
      <EmptyState
        icon={ListChecks}
        title={t.workouts.emptyTitle}
        description={t.workouts.emptyBody}
        comingSoon
      />
    </>
  )
}
