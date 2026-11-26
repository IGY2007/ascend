import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Camera, ChevronLeft, ImageOff, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarFigure } from '@/features/avatar/AvatarFigure'
import {
  useAvatar,
  useGameState,
  useLocalProfile,
  useSessionSummary,
} from '@/features/profile/hooks'
import { formatDecimal } from '@/domain/numbers'
import { routineText } from '@/i18n/names'
import { formatLongDate, t } from '@/i18n'
import { cn } from '@/lib/utils'
import {
  drawShare,
  FORMAT_SIZE,
  overlayRect,
  type ShareData,
  type ShareFormat,
  type ShareLayout,
  type ShareState,
  type ShareTheme,
} from './share-render'

const sh = t.share

function durationLabel(seconds: number): string {
  const m = Math.max(1, Math.round(seconds / 60))
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m} min`
}

function volumeLabel(kg: number): string {
  return kg >= 10_000 ? `${formatDecimal(kg / 1000, 1)} t` : `${formatDecimal(kg, 0)} kg`
}

/**
 * Compartir el entrenamiento en una foto, estilo Strava: elegís una foto, encima van tus datos y
 * los movés y achicás con el dedo. Se exporta en formato historia (9:16) o post (4:5).
 */
export function SharePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const summary = useSessionSummary(id)
  const avatar = useAvatar()
  const game = useGameState()
  const profile = useLocalProfile()

  const [format, setFormat] = useState<ShareFormat>('story')
  const [state, setState] = useState<ShareState>({
    layout: 'classic',
    theme: 'clear',
    x: 0.5,
    y: 0.6,
    scale: 1.3,
  })
  const [photo, setPhoto] = useState<{ img: HTMLImageElement; w: number; h: number } | null>(null)
  const [avatarImg, setAvatarImg] = useState<HTMLImageElement | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dx: number; dy: number; dist: number; scale: number } | null>(null)

  const { w: W, h: H } = FORMAT_SIZE[format]

  const data = useMemo<ShareData | null>(() => {
    if (!summary) return null
    const { session } = summary
    const stats = [
      { label: sh.stats.time, value: durationLabel(session.durationSeconds ?? 0) },
      { label: sh.stats.volume, value: volumeLabel(summary.volume) },
      { label: sh.stats.sets, value: String(summary.sets) },
    ]
    if (summary.records.length > 0)
      stats.push({ label: sh.stats.records, value: String(summary.records.length) })
    return {
      title: routineText(session.name),
      subtitle: formatLongDate(new Date(session.startedAt)),
      stats,
      badge: summary.records.length > 0 ? sh.badgeRecord : null,
    }
  }, [summary])

  useEffect(() => {
    void document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // El personaje se pasa a imagen para dibujarlo en el canvas
  useEffect(() => {
    const svg = avatarRef.current?.querySelector('svg')
    if (!svg || !avatar) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', '400')
    clone.setAttribute('height', '620')
    const img = new Image()
    img.onload = () => setAvatarImg(img)
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
    // Se reintenta cuando aparece la pantalla (antes de cargar el resumen no está montada)
  }, [avatar, game?.monthBody, summary?.session.id])

  // Redibuja la vista previa
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !data) return
    const frame = requestAnimationFrame(() => drawShare(ctx, W, H, data, state, photo, avatarImg))
    return () => cancelAnimationFrame(frame)
  }, [data, state, photo, avatarImg, W, H, fontsReady])

  const toCanvas = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!data) return
    const p = toCanvas(e)
    pointers.current.set(e.pointerId, p)
    e.currentTarget.setPointerCapture(e.pointerId)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = {
        dx: 0,
        dy: 0,
        dist: Math.hypot(a!.x - b!.x, a!.y - b!.y),
        scale: state.scale,
      }
      return
    }
    const r = overlayRect(W, H, data, state)
    const inside = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
    // Tocar afuera también mueve el bloque hasta ahí (más fácil con el dedo)
    gesture.current = inside
      ? { dx: p.x - state.x * W, dy: p.y - state.y * H, dist: 0, scale: state.scale }
      : { dx: 0, dy: 0, dist: 0, scale: state.scale }
    if (!inside) setState((s) => clampPos({ ...s, x: p.x / W, y: p.y / H }))
  }

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    const p = toCanvas(e)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size >= 2 && gesture.current.dist > 0) {
      const [a, b] = [...pointers.current.values()]
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y)
      const scale = Math.min(1.8, Math.max(0.4, (gesture.current.scale * d) / gesture.current.dist))
      setState((s) => ({ ...s, scale }))
      return
    }
    const g = gesture.current
    setState((s) => clampPos({ ...s, x: (p.x - g.dx) / W, y: (p.y - g.dy) / H }))
  }

  const onUp = (e: PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) gesture.current = null
  }

  const pickPhoto = (file: File | undefined) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => setPhoto({ img, w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => toast.error(sh.photoError)
    img.src = url
  }

  const share = async () => {
    if (!data) return
    setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      drawShare(canvas.getContext('2d')!, W, H, data, state, photo, avatarImg)
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92))
      if (!blob) throw new Error('no blob')
      const file = new File([blob], 'ascend-entreno.jpg', { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: data.title })
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
      toast.success(sh.saved)
    } catch {
      toast.error(t.auth.errors.unknown)
    } finally {
      setBusy(false)
    }
  }

  if (summary === undefined) return <Skeleton className="m-5 h-96" />
  if (summary === null) return <p className="p-8 text-center text-muted">{t.workout.notFound}</p>

  const seg = <T extends string>(value: T, options: [T, string][], onPick: (v: T) => void) => (
    <div
      className="grid gap-1 rounded-2xl bg-card p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
    >
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onPick(v)}
          className={cn(
            'h-10 truncate rounded-xl px-2 text-sm font-semibold transition-colors',
            value === v ? 'bg-accent text-accent-fg' : 'text-muted',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-safe pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <header className="flex items-center gap-2 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t.common.back}
          className="-ml-2 grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">{sh.title}</h1>
      </header>

      {/* Vista previa: se arrastra y se pellizca */}
      <div
        className="mx-auto overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-20px_rgb(0_0_0/0.8)]"
        style={{ aspectRatio: `${W} / ${H}`, maxHeight: '58dvh' }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="block size-full touch-none"
          aria-label={sh.preview}
        />
      </div>
      <p className="mt-2 text-center text-xs text-subtle">{sh.hint}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-field)] bg-accent font-semibold text-accent-fg active:scale-[0.99]">
          <Camera className="size-5" />
          {photo ? sh.changePhoto : sh.pickPhoto}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
        </label>
        <Button variant="secondary" size="md" disabled={!photo} onClick={() => setPhoto(null)}>
          <ImageOff />
          {sh.noPhoto}
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {seg<ShareLayout>(
          state.layout,
          [
            ['classic', sh.layouts.classic],
            ['compact', sh.layouts.compact],
            ['character', sh.layouts.character],
          ],
          (layout) => setState((s) => ({ ...s, layout })),
        )}
        <div className="grid grid-cols-2 gap-2">
          {seg<ShareFormat>(
            format,
            [
              ['story', sh.formats.story],
              ['post', sh.formats.post],
            ],
            setFormat,
          )}
          {seg<ShareTheme>(
            state.theme,
            [
              ['clear', sh.themes.clear],
              ['card', sh.themes.card],
            ],
            (theme) => setState((s) => ({ ...s, theme })),
          )}
        </div>
        <label className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2.5">
          <span className="text-sm font-medium text-muted">{sh.size}</span>
          <input
            type="range"
            min={40}
            max={180}
            value={Math.round(state.scale * 100)}
            onChange={(e) => setState((s) => ({ ...s, scale: Number(e.target.value) / 100 }))}
            className="h-11 flex-1 accent-[var(--color-accent)]"
          />
        </label>
      </div>

      <Button size="lg" block className="mt-5" loading={busy} onClick={() => void share()}>
        <Share2 />
        {sh.share}
      </Button>

      {/* Personaje oculto: se convierte en imagen para el diseño "Con personaje" */}
      <div
        ref={avatarRef}
        className="pointer-events-none fixed -left-[9999px] size-0 overflow-hidden"
        aria-hidden
      >
        {avatar && (
          <AvatarFigure
            avatar={avatar}
            body={game?.monthBody}
            jerseyNumber={game?.level.level}
            heightCm={profile?.heightCm}
          />
        )}
      </div>
    </div>
  )
}

/** Que el centro del bloque no se vaya de la imagen. */
function clampPos(s: ShareState): ShareState {
  return { ...s, x: Math.min(0.95, Math.max(0.05, s.x)), y: Math.min(0.95, Math.max(0.05, s.y)) }
}
