/**
 * Dibujo de la imagen para compartir (estilo Strava): la foto del entrenamiento y encima un bloque
 * con los datos, que se puede mover y escalar. Todo en canvas, así lo que ves es lo que se exporta.
 */

export type ShareLayout = 'classic' | 'compact' | 'character'
export type ShareTheme = 'clear' | 'card'
export type ShareFormat = 'story' | 'post'

export interface ShareStat {
  label: string
  value: string
}

export interface ShareData {
  title: string
  subtitle: string
  stats: ShareStat[]
  /** Etiqueta chiquita arriba del título (ej.: "Nuevo récord"). */
  badge?: string | null
}

export interface ShareState {
  layout: ShareLayout
  theme: ShareTheme
  /** Centro del bloque, normalizado 0–1. */
  x: number
  y: number
  scale: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export const FORMAT_SIZE: Record<ShareFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  post: { w: 1080, h: 1350 },
}

const FONT = '"Inter Variable", Inter, system-ui, -apple-system, sans-serif'
const WHITE = '#ffffff'
const LIME = '#facc15'
const VIOLET = '#8b5cf6'

/** Fondo: la foto recortada para llenar, o un degradado de la marca si no hay foto. */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  photo: CanvasImageSource | null,
  pw = 0,
  ph = 0,
) {
  if (photo && pw && ph) {
    const k = Math.max(W / pw, H / ph)
    const dw = pw * k
    const dh = ph * k
    ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh)
    // Viñeta suave para que el texto se lea en cualquier foto
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, 'rgba(0,0,0,0.25)')
    g.addColorStop(0.35, 'rgba(0,0,0,0)')
    g.addColorStop(0.65, 'rgba(0,0,0,0)')
    g.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    return
  }
  ctx.fillStyle = '#0e0b16'
  ctx.fillRect(0, 0, W, H)
  const r = ctx.createRadialGradient(W * 0.3, H * 0.75, 0, W * 0.3, H * 0.75, H * 0.8)
  r.addColorStop(0, 'rgba(139,92,246,0.55)')
  r.addColorStop(1, 'rgba(139,92,246,0)')
  ctx.fillStyle = r
  ctx.fillRect(0, 0, W, H)
  const r2 = ctx.createRadialGradient(W * 0.9, H * 0.08, 0, W * 0.9, H * 0.08, H * 0.45)
  r2.addColorStop(0, 'rgba(250,204,21,0.22)')
  r2.addColorStop(1, 'rgba(250,204,21,0)')
  ctx.fillStyle = r2
  ctx.fillRect(0, 0, W, H)
}

/** Logo: pico + chevron y la palabra ASCEND. */
function drawLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  align: 'center' | 'left',
) {
  ctx.save()
  ctx.font = `800 ${size}px ${FONT}`
  ctx.letterSpacing = `${size * 0.12}px`
  const text = 'ASCEND'
  const tw = ctx.measureText(text).width
  const icon = size * 1.05
  const gap = size * 0.4
  const total = icon + gap + tw
  const x0 = align === 'center' ? x - total / 2 : x
  // Pico
  const s = icon / 24
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2.8 * s
  ctx.strokeStyle = WHITE
  ctx.beginPath()
  ctx.moveTo(x0 + 3.75 * s, y + 20.25 * s - icon * 0.82)
  ctx.lineTo(x0 + 12 * s, y + 4 * s - icon * 0.82)
  ctx.lineTo(x0 + 20.25 * s, y + 20.25 * s - icon * 0.82)
  ctx.stroke()
  ctx.strokeStyle = VIOLET
  ctx.beginPath()
  ctx.moveTo(x0 + 9 * s, y + 19 * s - icon * 0.82)
  ctx.lineTo(x0 + 12 * s, y + 13.75 * s - icon * 0.82)
  ctx.lineTo(x0 + 15 * s, y + 19 * s - icon * 0.82)
  ctx.stroke()
  ctx.fillStyle = WHITE
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x0 + icon + gap, y)
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Tamaño base (escala 1) de cada diseño, en px de un lienzo de 1080 de ancho. */
function baseSize(layout: ShareLayout, data: ShareData): { w: number; h: number } {
  const n = data.stats.length
  if (layout === 'compact') return { w: 900, h: 300 }
  if (layout === 'character') return { w: 860, h: 470 }
  return { w: 600, h: 260 + n * 165 + 90 }
}

/** El rectángulo que ocupa el bloque de datos (para arrastrarlo). */
export function overlayRect(W: number, H: number, data: ShareData, st: ShareState): Rect {
  const b = baseSize(st.layout, data)
  const w = b.w * st.scale
  const h = b.h * st.scale
  return { x: st.x * W - w / 2, y: st.y * H - h / 2, w, h }
}

export function drawShare(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  data: ShareData,
  st: ShareState,
  photo: { img: CanvasImageSource; w: number; h: number } | null,
  avatar: CanvasImageSource | null,
) {
  ctx.clearRect(0, 0, W, H)
  drawBackground(ctx, W, H, photo?.img ?? null, photo?.w, photo?.h)

  const rect = overlayRect(W, H, data, st)
  const b = baseSize(st.layout, data)
  ctx.save()
  ctx.translate(rect.x, rect.y)
  ctx.scale(st.scale, st.scale)

  if (st.theme === 'card') {
    ctx.fillStyle = 'rgba(9,9,11,0.62)'
    roundRect(ctx, 0, 0, b.w, b.h, 44)
    ctx.fill()
    ctx.strokeStyle = 'rgba(139,92,246,0.55)'
    ctx.lineWidth = 3
    ctx.stroke()
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 2
  }

  ctx.fillStyle = WHITE
  ctx.textBaseline = 'alphabetic'

  if (st.layout === 'classic') {
    const cx = b.w / 2
    ctx.textAlign = 'center'
    let y = 70
    if (data.badge) {
      ctx.font = `700 30px ${FONT}`
      ctx.fillStyle = LIME
      ctx.fillText(data.badge.toUpperCase(), cx, y - 6)
      y += 30
    }
    ctx.fillStyle = WHITE
    ctx.font = `800 54px ${FONT}`
    ctx.fillText(fit(ctx, data.title, b.w - 60), cx, y + 30)
    ctx.font = `500 30px ${FONT}`
    ctx.globalAlpha = 0.85
    ctx.fillText(data.subtitle, cx, y + 72)
    ctx.globalAlpha = 1
    y += 160 - (data.badge ? 30 : 0)
    for (const s of data.stats) {
      ctx.font = `500 32px ${FONT}`
      ctx.globalAlpha = 0.85
      ctx.fillText(s.label, cx, y)
      ctx.globalAlpha = 1
      ctx.font = `800 92px ${FONT}`
      ctx.fillText(s.value, cx, y + 92)
      y += 165
    }
    drawLogo(ctx, cx, b.h - 50, 40, 'center')
  } else if (st.layout === 'compact') {
    ctx.textAlign = 'left'
    ctx.font = `800 46px ${FONT}`
    ctx.fillText(fit(ctx, data.title, b.w - 340), 44, 84)
    drawLogo(ctx, b.w - 290, 82, 34, 'left')
    const stats = data.stats.slice(0, 4)
    const colW = (b.w - 88) / stats.length
    stats.forEach((s, i) => {
      const x = 44 + i * colW + (i > 0 ? 28 : 0)
      if (i > 0) {
        ctx.save()
        ctx.globalAlpha = 0.35
        ctx.fillRect(44 + i * colW, 140, 3, 120)
        ctx.restore()
      }
      ctx.font = `800 62px ${FONT}`
      ctx.fillText(fit(ctx, s.value, colW - 40), x, 204)
      ctx.font = `500 28px ${FONT}`
      ctx.globalAlpha = 0.85
      ctx.fillText(s.label, x, 248)
      ctx.globalAlpha = 1
    })
  } else {
    // Con personaje: tu personaje a la izquierda, datos a la derecha
    const aw = 250
    if (avatar) ctx.drawImage(avatar, 20, 20, aw, aw * 1.55)
    const x = aw + 50
    ctx.textAlign = 'left'
    let y = 80
    if (data.badge) {
      ctx.font = `700 28px ${FONT}`
      ctx.fillStyle = LIME
      ctx.fillText(data.badge.toUpperCase(), x, y - 4)
      ctx.fillStyle = WHITE
      y += 36
    }
    ctx.font = `800 50px ${FONT}`
    ctx.fillText(fit(ctx, data.title, b.w - x - 40), x, y + 20)
    ctx.font = `500 28px ${FONT}`
    ctx.globalAlpha = 0.85
    ctx.fillText(data.subtitle, x, y + 60)
    ctx.globalAlpha = 1
    const stats = data.stats.slice(0, 4)
    const colW = (b.w - x - 30) / 2
    stats.forEach((s, i) => {
      const sx = x + (i % 2) * colW
      const sy = y + 140 + Math.floor(i / 2) * 112
      ctx.font = `800 62px ${FONT}`
      ctx.fillText(fit(ctx, s.value, colW - 12), sx, sy)
      ctx.font = `500 26px ${FONT}`
      ctx.globalAlpha = 0.85
      ctx.fillText(s.label, sx, sy + 38)
      ctx.globalAlpha = 1
    })
    drawLogo(ctx, x, b.h - 30, 28, 'left')
  }
  ctx.restore()
  return rect
}

/** Recorta el texto con "…" si no entra en el ancho. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t}…`
}
