import { History } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { t } from '@/i18n'

export function ProgressPage() {
  return (
    <>
      <PageHeader title={t.progress.title} subtitle={t.progress.subtitle} />
      <EmptyState
        icon={History}
        title={t.progress.emptyTitle}
        description={t.progress.emptyBody}
        comingSoon
      />
    </>
  )
}
