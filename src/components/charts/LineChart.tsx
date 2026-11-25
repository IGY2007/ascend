import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { fromDateKey } from '@/domain/dates'
import { formatDecimal } from '@/domain/numbers'
import { locale } from '@/i18n'
import { useElementWidth } from './use-element-width'

export interface LinePoint {
  date: string // AAAA-MM-DD
  value: number
}

const HEIGHT = 200
const PAD = { top: 16, right: 16, bottom: 26, left: 40 }
const LINE = '#8B5CF6' // validado contra la superficie de las cards
const shortDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })

interface Props {
  points: LinePoint[]
  unit: string
  label: string
  emptyText: string
  decimals?: number
}

/**
 * Línea de una sola serie (sin leyenda: el título la nombra). Línea de 2 px, grilla tenue,
 * cursor + tooltip al tocar. La lista de datos debajo hace de vista de tabla.
 */
export function LineChart({ points, unit, label, emptyText, decimals = 1 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useElementWidth(ref)
  const [hover, setHover] = useState<number | null>(null)

  const geo = useMemo(() => {
    if (points.length < 2 || width === 0) return null
    const times = points.map((p) => fromDateKey(p.date).getTime())
    const values = points.map((p) => p.value)
    const t0 = Math.min(...times)
    const t1 = Math.max(...times)
    const span = Math.max(...values) - Math.min(...values)
    const pad = Math.max(span * 0.15, 1)
    let lo = Math.floor(Math.min(...values) - pad)
    let hi = Math.ceil(Math.max(...values) + pad)
    if (hi - lo < 2) {
      lo -= 1
      hi += 1
    }
    const innerW = width - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const x = (time: number) =>
      PAD.left + (t1 === t0 ? innerW / 2 : ((time - t0) / (t1 - t0)) * innerW)
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * innerH
    const xy = points.map((p, i) => ({ x: x(times[i]!), y: y(p.value) }))
    return {
      xy,
      y,
      ticks: [lo, (lo + hi) / 2, hi],
      path: xy.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(''),
    }
  }, [points, width])

  const onPointer = (e: PointerEvent<SVGSVGElement>) => {
    if (!geo) return
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left
    let best = 0
    geo.xy.forEach((p, i) => {
      if (Math.abs(p.x - px) < Math.abs(geo.xy[best]!.x - px)) best = i
    })
    setHover(best)
  }

  const active = hover ?? points.length - 1
  const ap = points[active]
  const axy = geo?.xy[active]

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
      {geo && ap && axy ? (
        <>
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={label}
            className="block touch-pan-y select-none"
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
                  {formatDecimal(v, 0)}
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
              stroke={LINE}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {hover !== null && (
              <line
                x1={axy.x}
                x2={axy.x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                className="stroke-border-strong"
              />
            )}
            <circle
              cx={axy.x}
              cy={axy.y}
              r={5}
              fill={LINE}
              className="stroke-card"
              strokeWidth={2}
            />
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-0 rounded-xl border border-border bg-card-2/95 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
              style={{
                left: Math.min(Math.max(axy.x - 55, 0), width - 110),
                width: 110,
                transform: `translateY(${axy.y < 60 ? axy.y + 14 : axy.y - 54}px)`,
              }}
            >
              <p className="text-muted">{shortDate.format(fromDateKey(ap.date))}</p>
              <p className="num font-semibold text-fg">
                {formatDecimal(ap.value, decimals)} {unit}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border px-6 text-center text-sm text-muted">
          {emptyText}
        </div>
      )}
    </div>
  )
}
