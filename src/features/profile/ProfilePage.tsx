import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CloudOff, Download, HardDrive, LogOut, Mail, Pencil, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader } from '@/components/ui/page-header'
import { Sheet } from '@/components/ui/sheet'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { MacroTiles } from '@/features/nutrition/MacroTiles'
import { UnitField } from '@/features/onboarding/UnitField'
import { useAuth, useUser } from '@/features/auth/auth-context'
import { authErrorMessage, authService } from '@/services/auth'
import { backupService, nutritionService } from '@/services/local-data'
import { kcalFromMacros } from '@/domain/nutrition'
import { formatDecimal } from '@/domain/numbers'
import { toDateKey } from '@/domain/dates'
import { isLocalMode } from '@/lib/env'
import { formatMonthYear, t } from '@/i18n'
import type { MacroTargets } from '@/types/models'
import { useDisplayName } from './use-profile'
import { useLocalProfile, useNutritionGoal } from './hooks'

const pr = t.profile

export function ProfilePage() {
  const user = useUser()
  const name = useDisplayName()
  const profile = useLocalProfile()
  const goal = useNutritionGoal()
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
        [pr.trainingLabel, pr.trainingValue(profile.trainingDays.length, profile.sessionMinutes)],
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
            <p className="mt-4 text-xs leading-relaxed text-subtle">{t.onboarding.estimateNote}</p>
          </Card>
        </>
      )}

      {profile && (
        <>
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

function EditMacrosSheet({
  open,
  onOpenChange,
  current,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  current: MacroTargets
}) {
  const [p, setP] = useState<number | null>(current.proteinG)
  const [c, setC] = useState<number | null>(current.carbsG)
  const [f, setF] = useState<number | null>(current.fatG)
  const valid = [p, c, f].every((v) => v !== null && v >= 0 && v <= 1000)
  const kcal = valid ? kcalFromMacros({ proteinG: p!, carbsG: c!, fatG: f! }) : null

  const save = async () => {
    if (!valid) return
    await nutritionService.setManual({
      proteinG: Math.round(p!),
      carbsG: Math.round(c!),
      fatG: Math.round(f!),
    })
    toast.success(pr.macrosSaved)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setP(current.proteinG)
          setC(current.carbsG)
          setF(current.fatG)
        }
        onOpenChange(o)
      }}
      title={pr.editMacros}
      description={pr.editMacrosHint}
    >
      <form
        className="space-y-4 pt-2"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <UnitField
          label={t.macros.protein}
          unit={t.units.g}
          kind="integer"
          value={p}
          onChange={setP}
        />
        <UnitField
          label={t.macros.carbs}
          unit={t.units.g}
          kind="integer"
          value={c}
          onChange={setC}
        />
        <UnitField label={t.macros.fat} unit={t.units.g} kind="integer" value={f} onChange={setF} />
        <p className="text-center num text-sm text-muted">
          = <span className="text-lg font-semibold text-fg">{kcal !== null ? formatDecimal(kcal, 0) : '—'}</span> {t.units.kcal}
        </p>
        <Button type="submit" size="lg" block disabled={!valid}>
          {t.common.save}
        </Button>
      </form>
    </Sheet>
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
