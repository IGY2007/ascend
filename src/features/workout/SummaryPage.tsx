import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Check, ChevronLeft, Pencil, Trash2, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { useGameState, useSessionSummary, useSessionView } from '@/features/profile/hooks'
import { Confetti } from '@/components/ui/confetti'
import { sessionXp } from '@/domain/gamification'
import { workoutService } from '@/services/workout'
import { formatDuration } from '@/domain/workout'
import { formatDecimal, formatSigned } from '@/domain/numbers'
import { locale, t } from '@/i18n'

const wk = t.workout
const dateFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })

export function SummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fresh = (useLocation().state as { fresh?: boolean } | null)?.fresh === true
  const summary = useSessionSummary(id)
  const view = useSessionView(id)
  const game = useGameState()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const close = () => {
    if (fresh) navigate('/', { replace: true })
    else if ((window.history.state as { idx?: number } | null)?.idx) navigate(-1)
    else navigate('/progress')
  }

  if (summary === undefined) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-5 pt-safe">
        <Skeleton className="mt-10 h-24" />
        <Skeleton className="h-40" />
      </div>
    )
  }
  if (summary === null) return <p className="p-8 text-center text-muted">{wk.notFound}</p>

  const { session, comparison, records } = summary
  const stats = [
    { label: wk.duration, value: formatDuration(session.durationSeconds ?? 0) },
    { label: wk.exercises, value: String(summary.exercises) },
    { label: wk.setsDone, value: String(summary.sets) },
  ]

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-5 pt-safe pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      {!fresh && (
        <button
          type="button"
          onClick={close}
          className="mt-3 -ml-2 inline-flex h-11 items-center gap-1 pr-3 pl-1 font-medium text-muted"
        >
          <ChevronLeft className="size-5" />
          {t.common.back}
        </button>
      )}

      <header className={fresh ? 'pt-12 text-center' : 'pt-4'}>
        {fresh && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-success text-bg shadow-[0_0_0_10px_rgb(163_230_53/0.12),0_0_60px_rgb(163_230_53/0.25)]"
          >
            <Check className="size-10" strokeWidth={3} />
          </motion.div>
        )}
        <p className="text-sm text-muted first-letter:uppercase">
          {dateFmt.format(new Date(session.startedAt))}
        </p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight">
          {fresh ? wk.summaryTitle : session.name}
        </h1>
        {fresh && <p className="mt-1 text-muted">{session.name}</p>}
      </header>

      {fresh && summary.records.length > 0 && <Confetti burstKey={session.id} />}
      {fresh && game && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 rounded-2xl border border-success/30 bg-success/8 px-4 py-3"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="num text-lg font-bold text-success">
              {t.game.xpEarned(sessionXp(summary.sets, summary.records.length))}
            </p>
            <p className="text-sm font-medium">
              {t.game.level(game.level.level)} · {t.game.titles[game.level.title]}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-card-2">
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-success"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: game.level.into / game.level.needed }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-1.5 num text-xs text-muted">
            {t.game.xpToGo(game.level.needed - game.level.into)}
          </p>
        </motion.div>
      )}

      <Card highlight className="mt-7">
        <p className="text-sm text-muted">{wk.volume}</p>
        <p className="flex items-baseline gap-1.5">
          <AnimatedNumber value={summary.volume} className="text-4xl font-bold" />
          <span className="text-muted">{t.units.kg}</span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-muted">{s.label}</p>
              <p className="mt-0.5 num text-xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {records.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-sm font-medium text-muted">{wk.records}</h2>
          <ul className="space-y-2">
            {records.map((r, i) => (
              <motion.li
                key={r.exerciseId + r.kind}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/8 px-4 py-3"
              >
                <Trophy className="size-5 shrink-0 text-warning" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.exerciseName}</span>
                  <span className="block num text-sm text-muted">
                    {r.kind === 'weight'
                      ? wk.recordWeight(formatDecimal(r.value))
                      : wk.recordE1rm(formatDecimal(r.value, 1))}
                    {' · '}
                    {formatSigned(r.value - r.previous, 1)} {t.units.kg}
                  </span>
                </span>
              </motion.li>
            ))}
          </ul>
          {records.some((r) => r.kind === 'e1rm') && (
            <p className="mt-2 px-1 text-xs text-subtle">{wk.e1rmNote}</p>
          )}
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 px-1 text-sm font-medium text-muted">{wk.vsLast}</h2>
        {comparison ? (
          <Card className="space-y-2.5">
            {comparison.volumePct !== null && (
              <Delta
                value={comparison.volumePct}
                text={wk.volumeVs(formatSigned(comparison.volumePct, 1))}
              />
            )}
            {comparison.setsDiff !== 0 && (
              <Delta
                value={comparison.setsDiff}
                text={wk.setsVs(formatSigned(comparison.setsDiff, 0))}
              />
            )}
            {comparison.durationDiff !== null && (
              <Delta
                value={-comparison.durationDiff}
                text={wk.durationVs(formatSigned(Math.round(comparison.durationDiff / 60), 0))}
              />
            )}
          </Card>
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted">
            {wk.firstOfRoutine}
          </p>
        )}
      </section>

      {/* Detalle de lo que hiciste */}
      {view && (
        <section className="mt-6 space-y-2.5">
          {view.exercises.map((e) => (
            <Card key={e.id} className="p-4">
              <p className="font-semibold">{e.exerciseNameSnapshot}</p>
              <p className="mt-1 num text-sm text-muted">
                {e.sets
                  .map((s) =>
                    e.exercise?.exerciseType === 'timed'
                      ? `${s.durationSeconds ?? '—'} s`
                      : `${s.weightKg !== null ? formatDecimal(s.weightKg) : '—'} × ${s.repetitions ?? '—'}`,
                  )
                  .join(' · ')}
              </p>
            </Card>
          ))}
        </section>
      )}

      <Button size="lg" block className="mt-8" onClick={close}>
        {wk.ok}
      </Button>
      <Button
        variant="secondary"
        block
        className="mt-3"
        onClick={() => navigate(`/workout/${session.id}/edit`)}
      >
        <Pencil />
        {wk.edit}
      </Button>
      {!fresh && (
        <Button
          variant="ghost"
          block
          className="mt-3 text-danger"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 />
          {wk.deleteSession}
        </Button>
      )}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={wk.deleteSessionTitle}
        description={wk.deleteSessionBody}
        confirmLabel={t.workouts.delete}
        destructive
        onConfirm={async () => {
          await workoutService.remove(session.id)
          navigate('/progress', { replace: true })
        }}
      />
    </div>
  )
}

function Delta({ value, text }: { value: number; text: string }) {
  const up = value > 0
  return (
    <p className="flex items-center gap-2 num text-[0.95rem]">
      {up ? (
        <TrendingUp className="size-4 text-success" />
      ) : (
        <TrendingDown className="size-4 text-muted" />
      )}
      <span className={up ? 'text-fg' : 'text-muted'}>{text}</span>
    </p>
  )
}
