import { useState } from 'react'
import { CloudOff, LogOut, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth, useUser } from '@/features/auth/auth-context'
import { authErrorMessage, authService } from '@/services/auth'
import { formatMonthYear, t } from '@/i18n'
import { useDisplayName, useProfile } from './use-profile'

export function ProfilePage() {
  const user = useUser()
  const { isOfflineSession } = useAuth()
  const { data: profile, isPending } = useProfile()
  const name = useDisplayName()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const since = profile?.created_at ?? user.createdAt
  const initial = (name ?? user.email ?? '?').trim().charAt(0).toUpperCase()

  const signOut = async () => {
    setSigningOut(true)
    try {
      await authService.signOut()
    } catch (e) {
      toast.error(authErrorMessage(e))
      setSigningOut(false)
    }
  }

  return (
    <>
      <PageHeader title={t.profile.title} />

      <Card highlight className="flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2/70 p-[2px]">
          <div className="grid size-full place-items-center rounded-full bg-card text-2xl font-semibold">
            {initial}
          </div>
        </div>
        <div className="min-w-0">
          {isPending && !name ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <p className="truncate text-lg font-semibold">{name ?? user.email}</p>
          )}
          {since && (
            <p className="mt-0.5 text-sm text-muted first-letter:uppercase">
              {t.profile.memberSince(formatMonthYear(new Date(since)))}
            </p>
          )}
        </div>
      </Card>

      <h2 className="mt-8 mb-3 px-1 text-sm font-medium text-muted">{t.profile.account}</h2>
      <Card className="space-y-4">
        {user.email && (
          <div className="flex items-center gap-3 text-[0.95rem]">
            <Mail className="size-5 text-muted" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
        {isOfflineSession && (
          <div className="flex items-start gap-3 text-sm text-muted">
            <CloudOff className="mt-0.5 size-5 shrink-0" />
            <span>{t.profile.offlineSession}</span>
          </div>
        )}
        <Button variant="danger" block onClick={() => setConfirmOpen(true)} loading={signingOut}>
          <LogOut />
          {t.auth.logout}
        </Button>
      </Card>

      <p className="mt-8 text-center text-xs text-subtle">{t.profile.version(__APP_VERSION__)}</p>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t.auth.logoutConfirmTitle}
        description={t.auth.logoutConfirmBody}
        confirmLabel={t.auth.logout}
        destructive
        onConfirm={() => void signOut()}
      />
    </>
  )
}
