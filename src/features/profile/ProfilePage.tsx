import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CloudOff, Download, HardDrive, LogOut, Mail, Pencil, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader } from '@/components/ui/page-header'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { MacroTiles } from '@/features/nutrition/MacroTiles'
import { EditMacrosSheet } from '@/features/nutrition/EditMacrosSheet'
import { useAuth, useUser } from '@/features/auth/auth-context'
import { authErrorMessage, authService } from '@/services/auth'
import { backupService, bodyMetrics, nutritionService } from '@/services/local-data'
import { MetricsGrid } from '@/features/nutrition/MetricsGrid'
import { formatDecimal } from '@/domain/numbers'
import { toDateKey } from '@/domain/dates'
import { isLocalMode } from '@/lib/env'
import { formatMonthYear, lang, LANGS, setLanguage, t } from '@/i18n'
import { cn } from '@/lib/utils'
import { LevelCard } from '@/features/game/LevelCard'
import { AvatarCard } from '@/features/avatar/AvatarCard'
import { AchievementsGrid } from '@/features/game/AchievementsGrid'
import { useDisplayName } from './use-profile'
import { useLatestWeight, useLocalProfile, useNutritionGoal } from './hooks'

const pr = t.profile

export function ProfilePage() {
  const user = useUser()
  const name = useDisplayName()
  const profile = useLocalProfile()
  const goal = useNutritionGoal()
  const latest = useLatestWeight()
  const currentWeight = latest?.weightKg ?? profile?.weightKg ?? null
  const metrics = profile && currentWeight ? bodyMetrics(profile, currentWeight) : null
  const navigate = useNavigate()
  const [redoOpen, setRedoOpen] = useState(false)
  const [macrosOpen, setMacrosOpen] = useState(false)

  const since = profile?.completedAt ?? user.createdAt
  const initial = (name ?? user.email ?? 'A').trim().charAt(0).toUpperCase()

  const exportBackup = async () => {
    const json = await backupService.exportJson()
    const filename = `ascend-backup-${toDateKey(new Date())}.json`
    const file = new File([json], filename, { type: 'application/json' })
    // En iPhone, compartir abre "Guardar en Archivos"; en desktop, se descarga.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(pr.exported)
  }

  const rows: [string, string][] = profile
    ? [
        [pr.goalLabel, t.labels.goal[profile.goal]],
        [t.onboarding.age, pr.ageValue(profile.age)],
        [t.onboarding.height, `${formatDecimal(profile.heightCm, 1)} ${t.units.cm}`],
        ...(profile.targetWeightKg
          ? ([
              [
                t.onboarding.targetWeight,
                `${formatDecimal(profile.targetWeightKg, 1)} ${t.units.kg}`,
              ],
            ] as [string, string][])
          : []),
        [pr.experienceLabel, t.labels.experience[profile.experience]],
        [pr.trainingLabel, pr.daysValue(profile.daysPerWeek, profile.sessionMinutes)],
        [pr.splitLabel, t.labels.split[profile.split]],
        [pr.placeLabel, t.labels.place[profile.place]],
      ]
    : []

  return (
    <>
      <PageHeader title={pr.title} />

      <Card highlight className="flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2/70 p-[2px]">
          <div className="grid size-full place-items-center rounded-full bg-card text-2xl font-semibold">
            {initial}
          </div>
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{name ?? user.email ?? t.app.name}</p>
          {since && (
            <p className="mt-0.5 text-sm text-muted first-letter:uppercase">
              {pr.memberSince(formatMonthYear(new Date(since)))}
            </p>
          )}
        </div>
      </Card>

      <LevelCard className="mt-4" />
      <AvatarCard />
      <SectionTitle>{t.game.achievementsTitle}</SectionTitle>
      <AchievementsGrid />

      {goal && (
        <>
          <SectionTitle>{pr.yourPlan}</SectionTitle>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-baseline gap-1.5">
                <AnimatedNumber value={goal.kcal} className="text-3xl font-bold" />
                <span className="text-sm text-muted">{t.units.kcal}</span>
              </p>
              <Button size="sm" variant="secondary" onClick={() => setMacrosOpen(true)}>
                <Pencil />
                {pr.editMacros}
              </Button>
            </div>
            <MacroTiles macros={goal} className="mt-4" />
            <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs leading-relaxed text-muted">
                {goal.source === 'manual' ? pr.manualMacros : pr.autoMacros}
              </p>
              {goal.source === 'manual' && currentWeight && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => void nutritionService.resetToCalculated(currentWeight)}
                >
                  {pr.resetMacros}
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-subtle">{t.onboarding.estimateNote}</p>
          </Card>
        </>
      )}

      {profile && (
        <>
          {metrics && (
            <>
              <SectionTitle>{t.onboarding.metrics}</SectionTitle>
              <MetricsGrid metrics={metrics} />
              <p className="mt-2 px-1 text-xs leading-relaxed text-subtle">
                {t.onboarding.metricsNote}
              </p>
            </>
          )}
          <SectionTitle>{pr.yourData}</SectionTitle>
          <Card className="divide-y divide-border py-1">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 py-3 text-[0.95rem]"
              >
                <span className="text-muted">{label}</span>
                <span className="text-right font-medium">{value}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>{pr.language}</SectionTitle>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card p-1" role="radiogroup">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={lang === l}
            onClick={() => setLanguage(l)}
            className={cn(
              'h-11 rounded-xl text-sm font-semibold transition-colors',
              lang === l ? 'bg-accent text-accent-fg' : 'text-muted',
            )}
          >
            {pr.languages[l]}
          </button>
        ))}
      </div>
      <p className="mt-2 px-1 text-xs text-subtle">{pr.languageHint}</p>

      <div className="mt-4 space-y-3">
        <Button variant="secondary" block onClick={() => setRedoOpen(true)}>
          <RotateCcw />
          {pr.redo}
        </Button>
        <Button variant="secondary" block onClick={() => void exportBackup()}>
          <Download />
          {pr.exportData}
        </Button>
      </div>

      {isLocalMode ? (
        <Card className="mt-6 flex items-start gap-3">
          <HardDrive className="mt-0.5 size-5 shrink-0 text-accent-2" />
          <div>
            <p className="font-medium">{pr.localModeTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{pr.localModeBody}</p>
          </div>
        </Card>
      ) : (
        <AccountSettings />
      )}

      <p className="mt-8 text-center text-xs text-subtle">{pr.version(__APP_VERSION__)}</p>

      <ConfirmDialog
        open={redoOpen}
        onOpenChange={setRedoOpen}
        title={pr.redoConfirmTitle}
        description={pr.redoConfirmBody}
        confirmLabel={pr.redo}
        onConfirm={() => navigate('/onboarding')}
      />
      {goal && <EditMacrosSheet open={macrosOpen} onOpenChange={setMacrosOpen} current={goal} />}
    </>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-8 mb-3 px-1 text-sm font-medium text-muted">{children}</h2>
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
      <SectionTitle>{pr.account}</SectionTitle>
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
            <span>{pr.offlineSession}</span>
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
