import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Download,
  HardDrive,
  LogOut,
  Mail,
  RotateCcw,
  Shirt,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EditMacrosSheet } from '@/features/nutrition/EditMacrosSheet'
import { useAuth, useUser } from '@/features/auth/auth-context'
import { authErrorMessage, authService } from '@/services/auth'
import { backupService, nutritionService } from '@/services/local-data'
import { formatDecimal } from '@/domain/numbers'
import { toDateKey } from '@/domain/dates'
import { isLocalMode } from '@/lib/env'
import { getThemePref, setThemePref, THEME_PREFS, type ThemePref } from '@/lib/theme'
import { lang, LANGS, setLanguage, t } from '@/i18n'
import { cn } from '@/lib/utils'
import { useLatestWeight, useLocalProfile, useNutritionGoal } from './hooks'

const pr = t.profile
const se = t.settings

/** Ajustes: todo lo que se configura (lo que se muestra vive en Perfil). */
export function SettingsPage() {
  const navigate = useNavigate()
  const profile = useLocalProfile()
  const goal = useNutritionGoal()
  const latest = useLatestWeight()
  const currentWeight = latest?.weightKg ?? profile?.weightKg ?? null
  const [macrosOpen, setMacrosOpen] = useState(false)
  const [redoOpen, setRedoOpen] = useState(false)
  const [theme, setTheme] = useState<ThemePref>(getThemePref)

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

  const segmented = <T extends string>(
    value: T,
    options: readonly T[],
    labels: Record<T, string>,
    onPick: (v: T) => void,
  ) => (
    <div
      className="grid gap-1 rounded-2xl bg-card p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onPick(o)}
          className={cn(
            'h-11 rounded-xl text-sm font-semibold transition-colors',
            value === o ? 'bg-accent text-accent-fg' : 'text-muted',
          )}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <header className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t.common.back}
          className="-ml-2 grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">{se.title}</h1>
      </header>

      <Card className="divide-y divide-border p-0">
        <Row icon={UserRound} label={se.myData} hint={se.myDataHint} to="/settings/data" />
        <Row icon={Shirt} label={se.character} to="/avatar" />
        {goal && (
          <Row
            icon={Apple}
            label={se.nutritionPlan}
            hint={se.nutritionPlanHint(formatDecimal(goal.kcal, 0))}
            onClick={() => setMacrosOpen(true)}
          />
        )}
      </Card>
      {goal && (
        <div className="mt-2 flex items-start justify-between gap-3 px-1">
          <p className="text-xs leading-relaxed text-subtle">
            {goal.source === 'manual' ? pr.manualMacros : pr.autoMacros}
          </p>
          {goal.source === 'manual' && currentWeight && (
            <Button
              size="sm"
              variant="ghost"
              className="-mt-2 shrink-0"
              onClick={() => void nutritionService.resetToCalculated(currentWeight)}
            >
              {pr.resetMacros}
            </Button>
          )}
        </div>
      )}

      <Title>{se.appearance}</Title>
      {segmented(theme, THEME_PREFS, se.themes, (v) => {
        setTheme(v)
        setThemePref(v)
      })}
      <p className="mt-2 px-1 text-xs text-subtle">{se.themeHint}</p>

      <Title>{pr.language}</Title>
      {segmented(lang, LANGS, pr.languages, setLanguage)}
      <p className="mt-2 px-1 text-xs text-subtle">{pr.languageHint}</p>

      <Title>{t.app.name}</Title>
      <Button variant="secondary" block onClick={() => void exportBackup()}>
        <Download />
        {pr.exportData}
      </Button>
      {isLocalMode ? (
        <Card className="mt-3 flex items-start gap-3">
          <HardDrive className="mt-0.5 size-5 shrink-0 text-accent-2" />
          <div>
            <p className="font-medium">{pr.localModeTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{pr.localModeBody}</p>
          </div>
        </Card>
      ) : (
        <AccountSettings />
      )}

      {/* Solo mientras probamos la app: después se edita todo desde "Mis datos" */}
      <Title>{se.testing}</Title>
      <Button variant="ghost" block onClick={() => setRedoOpen(true)}>
        <RotateCcw />
        {pr.redo}
      </Button>
      <p className="mt-1 px-1 text-center text-xs text-subtle">{se.testingHint}</p>

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

function Title({ children }: { children: string }) {
  return <h2 className="mt-7 mb-3 px-1 text-sm font-medium text-muted">{children}</h2>
}

function Row({
  icon: Icon,
  label,
  hint,
  to,
  onClick,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  to?: string
  onClick?: () => void
}) {
  const body: ReactNode = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card-2 text-accent-2">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block truncate text-sm text-muted">{hint}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-subtle" />
    </>
  )
  const cls =
    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card-2/50'
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
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
      <Title>{pr.account}</Title>
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
