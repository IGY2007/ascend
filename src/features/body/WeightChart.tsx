import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { formatDecimal } from '@/domain/numbers'
import { fromDateKey } from '@/domain/dates'
import type { WeightPoint } from '@/domain/body-weight'
import { locale, t } from '@/i18n'

const HEIGHT = 200
const PAD = { top: 16, right: 16, bottom: 26, left: 40 }
const shortDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })

/**
 * Línea de peso (una sola serie: sin leyenda, el título la nombra). Línea de 2 px, grilla tenue,
 * cursor + tooltip al tocar o pasar el mouse. La lista de registros funciona como vista de tabla.
 */
export function WeightChart({ points }: { points: WeightPoint[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  const geo = useMemo(() => {
    if (points.length < 2 || width === 0) return null
    const times = points.map((p) => fromDateKey(p.date).getTime())
    const values = points.map((p) => p.weightKg)
    const t0 = Math.min(...times)
    const t1 = Math.max(...times)
    let lo = Math.floor(Math.min(...values) - 0.5)
    let hi = Math.ceil(Math.max(...values) + 0.5)
    if (hi - lo < 2) {
      lo -= 1
      hi += 1
    }
    const innerW = width - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const x = (time: number) =>
      PAD.left + (t1 === t0 ? innerW / 2 : ((time - t0) / (t1 - t0)) * innerW)
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * innerH
    const xy = points.map((p, i) => ({ x: x(times[i]!), y: y(p.weightKg) }))
    const ticks = [lo, (lo + hi) / 2, hi]
    return {
      xy,
      ticks,
      y,
      path: xy.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(''),
    }
  }, [points, width])

  const onPointer = (e: PointerEvent<SVGSVGElement>) => {
    if (!geo) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    let best = 0
    geo.xy.forEach((p, i) => {
      if (Math.abs(p.x - px) < Math.abs(geo.xy[best]!.x - px)) best = i
    })
    setHover(best)
  }

  const active = hover ?? points.length - 1
  const activePoint = points[active]
  const activeXY = geo?.xy[active]

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
      {geo && activePoint && activeXY && (
        <>
          <svg
            width={width}
            height={HEIGHT}
            className="block touch-pan-y select-none"
            role="img"
            aria-label={t.progress.chartLabel}
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setHover(null)}
          >
            {geo.ticks.map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={geo.y(v)}
                  y2={geo.y(v)}
                  className="stroke-border"
                  strokeDasharray="2 4"
                />
                <text
                  x={PAD.left - 8}
                  y={geo.y(v)}
                  dy="0.35em"
                  textAnchor="end"
                  className="fill-subtle num text-[11px]"
                >
                  {formatDecimal(v, 1)}
                </text>
              </g>
            ))}
            <text x={PAD.left} y={HEIGHT - 6} className="fill-subtle text-[11px]">
              {shortDate.format(fromDateKey(points[0]!.date))}
            </text>
            <text
              x={width - PAD.right}
              y={HEIGHT - 6}
              textAnchor="end"
              className="fill-subtle text-[11px]"
            >
              {shortDate.format(fromDateKey(points.at(-1)!.date))}
            </text>

            <path
              d={geo.path}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {hover !== null && (
              <line
                x1={activeXY.x}
                x2={activeXY.x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                className="stroke-border-strong"
              />
            )}
            {/* Anillo del color de la superficie para separar el punto de la línea */}
            <circle
              cx={activeXY.x}
              cy={activeXY.y}
              r={5}
              fill="#8B5CF6"
              className="stroke-card"
              strokeWidth={2}
            />
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-0 rounded-xl border border-border bg-card-2/95 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
              style={{
                left: Math.min(Math.max(activeXY.x - 50, 0), width - 100),
                width: 100,
                transform: `translateY(${activeXY.y < 60 ? activeXY.y + 14 : activeXY.y - 54}px)`,
              }}
            >
              <p className="text-muted">{shortDate.format(fromDateKey(activePoint.date))}</p>
              <p className="num font-semibold text-fg">
                {formatDecimal(activePoint.weightKg, 1)} {t.units.kg}
              </p>
            </div>
          )}
        </>
      )}
      {points.length < 2 && (
        <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border px-6 text-center text-sm text-muted">
          {t.progress.chartNeedsMore}
        </div>
      )}
    </div>
  )
}
