import { useRef, useState } from 'react'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { useElementWidth } from './use-element-width'

export interface Bar {
  key: string
  /** Etiqueta del eje (corta) */
  label: string
  /** Etiqueta larga para el tooltip */
  title: string
  value: number
}

const HEIGHT = 170
const PAD = { top: 18, bottom: 24 }
const GAP = 6

interface Props {
  bars: Bar[]
  unit: string
  label: string
  /** Línea de referencia (ej.: objetivo de agua) */
  target?: number
  decimals?: number
  /** Resalta la última barra (semana o día actual) */
  highlightLast?: boolean
}

/**
 * Barras de una sola serie, ancladas a la base, extremos redondeados de 4 px y 2 px de separación
 * visual. Tooltip al tocar cada barra (zona táctil de toda la columna).
 */
export function BarChart({ bars, unit, label, target, decimals = 0, highlightLast = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useElementWidth(ref)
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, target ?? 0, ...bars.map((b) => b.value)) * 1.1
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const colW = bars.length ? width / bars.length : 0
  const barW = Math.max(4, Math.min(28, colW - GAP))
  const y = (v: number) => PAD.top + innerH * (1 - v / max)
  const active = hover !== null ? bars[hover] : null

  return (
    <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={label}
          className="block select-none"
          onPointerLeave={() => setHover(null)}
        >
          <line x1={0} x2={width} y1={y(0)} y2={y(0)} className="stroke-border" />
          {target !== undefined && (
            <line
              x1={0}
              x2={width}
              y1={y(target)}
              y2={y(target)}
              className="stroke-success/70"
              strokeDasharray="4 4"
            />
          )}
          {bars.map((b, i) => {
            const cx = colW * i + colW / 2
            const top = y(b.value)
            const h = Math.max(0, y(0) - top)
            const last = highlightLast && i === bars.length - 1
            return (
              <g key={b.key}>
                {/* Zona táctil: toda la columna */}
                <rect
                  x={colW * i}
                  y={0}
                  width={colW}
                  height={HEIGHT}
                  fill="transparent"
                  onPointerDown={() => setHover(i)}
                  onPointerEnter={() => setHover(i)}
                />
                {h > 0 && (
                  <path
                    d={`M${cx - barW / 2},${y(0)} V${top + Math.min(4, h)} Q${cx - barW / 2},${top} ${cx - barW / 2 + Math.min(4, barW / 2)},${top} H${cx + barW / 2 - Math.min(4, barW / 2)} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + Math.min(4, h)} V${y(0)} Z`}
                    className={cn(
                      'pointer-events-none',
                      last ? 'fill-accent' : 'fill-accent/45',
                      hover === i && 'fill-accent-2',
                    )}
                  />
                )}
                {/* Etiqueta directa selectiva: solo el valor de la barra actual */}
                {last && b.value > 0 && hover === null && (
                  <text
                    x={cx}
                    y={top - 5}
                    textAnchor="middle"
                    className="fill-fg num text-[11px] font-semibold"
                  >
                    {formatDecimal(b.value, decimals)}
                  </text>
                )}
                <text
                  x={cx}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  className={cn('num text-[10px]', last ? 'fill-muted' : 'fill-subtle')}
                >
                  {b.label}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl border border-border bg-card-2/95 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
          style={{
            left: Math.min(Math.max(colW * hover + colW / 2 - 60, 0), width - 120),
            width: 120,
          }}
        >
          <p className="truncate text-muted">{active.title}</p>
          <p className="num font-semibold text-fg">
            {formatDecimal(active.value, decimals)} {unit}
          </p>
        </div>
      )}
    </div>
  )
}
