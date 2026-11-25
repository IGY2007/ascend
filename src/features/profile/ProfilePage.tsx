import { useState, type FormEvent } from 'react'
import { CloudOff, HardDrive, LogOut, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field, Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth, useUser } from '@/features/auth/auth-context'
import { authErrorMessage, authService } from '@/services/auth'
import { isLocalMode } from '@/lib/env'
import { formatMonthYear, t } from '@/i18n'
import { useDisplayName, useProfile } from './use-profile'
import { setLocalName } from './local-profile'

export function ProfilePage() {
  const user = useUser()
  const { data: profile, isLoading } = useProfile()
  const name = useDisplayName()

  const since = profile?.created_at ?? user.createdAt
  const initial = (name ?? user.email ?? 'A').trim().charAt(0).toUpperCase()

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
          {isLoading && !name ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <p className="truncate text-lg font-semibold">{name ?? user.email ?? t.app.name}</p>
          )}
          {since && (
            <p className="mt-0.5 text-sm text-muted first-letter:uppercase">
              {t.profile.memberSince(formatMonthYear(new Date(since)))}
            </p>
          )}
        </div>
      </Card>

      {isLocalMode ? <LocalSettings currentName={name} /> : <AccountSettings />}

      <p className="mt-8 text-center text-xs text-subtle">{t.profile.version(__APP_VERSION__)}</p>
    </>
  )
}

function LocalSettings({ currentName }: { currentName: string | null }) {
  const [draft, setDraft] = useState(currentName ?? '')
  const dirty = draft.trim() !== (currentName ?? '')

  const save = (e: FormEvent) => {
    e.preventDefault()
    setLocalName(draft)
    toast.success(t.profile.nameSaved)
  }

  return (
    <>
      <Card className="mt-6">
        <form onSubmit={save} className="space-y-4">
          <Field label={t.profile.nameLabel}>
            {(p) => (
              <Input
                {...p}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={60}
                autoComplete="given-name"
                placeholder={t.profile.namePlaceholder}
              />
            )}
          </Field>
          <Button type="submit" variant="secondary" block disabled={!dirty}>
            {t.common.save}
          </Button>
        </form>
      </Card>

      <Card className="mt-4 flex items-start gap-3">
        <HardDrive className="mt-0.5 size-5 shrink-0 text-accent-2" />
        <div>
          <p className="font-medium">{t.profile.localModeTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t.profile.localModeBody}</p>
        </div>
      </Card>
    </>
  )
}

function AccountSettings() {
  const user = useUser()
  const { isOfflineSession } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

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
