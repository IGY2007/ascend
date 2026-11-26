import { memo } from 'react'
import {
  EMPTY_BODY,
  HAIR_COLORS,
  SHIRT_COLORS,
  SKINS,
  type AvatarConfig,
  type Body,
} from '@/domain/avatar'
import { cn } from '@/lib/utils'

const CX = 100
const INK = '#1f1a17'
const SHORTS = '#34313f'

interface Props {
  avatar: AvatarConfig
  /** Crecimiento de cada grupo (0–1). Sin datos: cuerpo base. */
  body?: Body
  /** 'head' recorta solo la cara (para chips y avatares chicos). */
  variant?: 'full' | 'head'
  className?: string
  title?: string
}

/**
 * El personaje en SVG, estilo chibi. Cada grupo muscular cambia de tamaño según lo entrenado:
 * si no hacés piernas, quedan flaquitas (y se nota).
 */
export const AvatarFigure = memo(function AvatarFigure({
  avatar,
  body = EMPTY_BODY,
  variant = 'full',
  className,
  title,
}: Props) {
  const skin = SKINS[avatar.skin] ?? SKINS[1]
  const hair = HAIR_COLORS[avatar.hairColor] ?? HAIR_COLORS[1]
  const shirt = SHIRT_COLORS[avatar.shirtColor] ?? SHIRT_COLORS[0]
  const { chest: c, back: b, shoulders: s, arms: a, legs: l, calves: k, core: o } = body

  // Torso: hombros más anchos con pecho y espalda (forma de V), cintura casi fija.
  const tw = 25 + 9 * c + 10 * b
  const ww = 21 + 2 * b
  const delt = 8 + 8 * s
  const ua = 10 + 11 * a // grosor del brazo
  const fa = 8 + 5 * a // antebrazo
  const armX = tw + 3 + ua * 0.35
  const lt = 13 + 17 * l // grosor del muslo
  const lx = 8 + lt * 0.45
  const cw = 9 + 11 * k // gemelo
  const neck = 8 + 3 * ((s + b) / 2)

  const torso = `M${CX - tw},104 Q${CX - tw - 3},140 ${CX - ww},178 L${CX + ww},178 Q${CX + tw + 3},140 ${CX + tw},104 Q${CX},97 ${CX - tw},104 Z`

  const viewBox = variant === 'head' ? '58 20 84 84' : '0 0 200 310'

  return (
    <svg
      viewBox={viewBox}
      className={cn('block', className)}
      role="img"
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Pelo largo: detrás de la cabeza */}
      {avatar.hair === 'long' && (
        <path
          d={`M${CX - 32},60 Q${CX - 38},112 ${CX - 22},122 L${CX + 22},122 Q${CX + 38},112 ${CX + 32},60 Z`}
          fill={hair}
        />
      )}

      {variant === 'full' && (
        <g>
          {/* Piernas */}
          {[-1, 1].map((side) => (
            <g key={side}>
              <ellipse cx={CX + side * lx} cy={230} rx={lt / 2} ry={26} fill={skin} />
              <ellipse cx={CX + side * (lx + cw * 0.12)} cy={266} rx={cw / 2} ry={19} fill={skin} />
              <rect x={CX + side * lx - 4} y={272} width={8} height={14} rx={4} fill={skin} />
              {/* Zapatillas */}
              <ellipse cx={CX + side * (lx + 3)} cy={291} rx={13} ry={7} fill="#e4e4e7" />
              <path
                d={`M${CX + side * (lx + 3) - 13},292 Q${CX + side * (lx + 3)},300 ${CX + side * (lx + 3) + 13},292`}
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
            </g>
          ))}
          {/* Short */}
          <path
            d={`M${CX - ww - 1},172 L${CX + ww + 1},172 L${CX + lx + lt / 2 + 3},216 L${CX + 2},216 L${CX},200 L${CX - 2},216 L${CX - lx - lt / 2 - 3},216 Z`}
            fill={SHORTS}
          />
          <rect x={CX - ww - 1} y={171} width={(ww + 1) * 2} height={6} rx={3} fill="#46425a" />

          {/* Brazos (detrás del torso) */}
          {[-1, 1].map((side) => (
            <g key={side}>
              <ellipse cx={CX + side * armX} cy={132} rx={ua / 2} ry={22} fill={skin} />
              {/* Bíceps */}
              {a > 0.25 && (
                <path
                  d={`M${CX + side * (armX - ua * 0.3)},122 Q${CX + side * (armX - ua * 0.65)},132 ${CX + side * (armX - ua * 0.3)},142`}
                  stroke="rgb(0 0 0 / 0.14)"
                  strokeWidth={1.6}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
              <ellipse cx={CX + side * (armX + 1)} cy={168} rx={fa / 2} ry={19} fill={skin} />
              <circle cx={CX + side * (armX + 1.5)} cy={190} r={6 + a * 1.5} fill={skin} />
            </g>
          ))}

          {/* Cuello y torso */}
          <rect x={CX - neck} y={84} width={neck * 2} height={22} rx={6} fill={skin} />
          <path d={torso} fill={skin} />

          {/* Sin remera: pectorales y abdominales a la vista */}
          {avatar.outfit === 'shirtless' && (
            <g stroke="rgb(0 0 0 / 0.16)" strokeWidth={1.6} fill="none" strokeLinecap="round">
              <path
                d={`M${CX - 2},114 Q${CX - tw * 0.6},${110 + 4 * c} ${CX - tw + 5},120 M${CX - 2},114 L${CX - 2},${126 + 4 * c} Q${CX - tw * 0.5},${132 + 5 * c} ${CX - tw + 6},${124 + 2 * c}`}
                opacity={0.4 + 0.6 * c}
              />
              <path
                d={`M${CX + 2},114 Q${CX + tw * 0.6},${110 + 4 * c} ${CX + tw - 5},120 M${CX + 2},114 L${CX + 2},${126 + 4 * c} Q${CX + tw * 0.5},${132 + 5 * c} ${CX + tw - 6},${124 + 2 * c}`}
                opacity={0.4 + 0.6 * c}
              />
              {o > 0.15 &&
                [0, 1, 2].map((row) => (
                  <g key={row} opacity={Math.min(1, o * 1.4)}>
                    <rect x={CX - 11} y={140 + row * 11} width={9} height={8} rx={3} />
                    <rect x={CX + 2} y={140 + row * 11} width={9} height={8} rx={3} />
                  </g>
                ))}
              <circle cx={CX} cy={170} r={1.4} fill="rgb(0 0 0 / 0.25)" stroke="none" />
            </g>
          )}

          {/* Musculosa */}
          {avatar.outfit === 'tank' && (
            <path
              d={`M${CX - tw + 7},106 Q${CX - tw + 1},140 ${CX - ww},178 L${CX + ww},178 Q${CX + tw - 1},140 ${CX + tw - 7},106 L${CX + 11},103 Q${CX},120 ${CX - 11},103 Z`}
              fill={shirt}
            />
          )}
          {/* Remera */}
          {avatar.outfit === 'tee' && (
            <>
              <path d={torso} fill={shirt} />
              <path
                d={`M${CX - 10},100 Q${CX},112 ${CX + 10},100`}
                stroke="rgb(0 0 0 / 0.18)"
                strokeWidth={2}
                fill="none"
              />
            </>
          )}
          {avatar.outfit !== 'shirtless' && c > 0.3 && (
            <path
              d={`M${CX - tw * 0.7},${128 + 3 * c} Q${CX - tw * 0.35},${136 + 3 * c} ${CX - 3},${128 + 2 * c} M${CX + 3},${128 + 2 * c} Q${CX + tw * 0.35},${136 + 3 * c} ${CX + tw * 0.7},${128 + 3 * c}`}
              stroke="rgb(0 0 0 / 0.14)"
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Hombros (deltoides), arriba de todo; con remera, tapados por la manga */}
          {[-1, 1].map((side) => (
            <circle
              key={side}
              cx={CX + side * (tw - 1)}
              cy={109}
              r={delt}
              fill={avatar.outfit === 'tee' ? shirt : skin}
            />
          ))}

          {/* Cadena */}
          {avatar.accessory === 'chain' && (
            <g>
              <path
                d={`M${CX - neck - 1},100 Q${CX},${118} ${CX + neck + 1},100`}
                stroke="#f5c542"
                strokeWidth={2.4}
                fill="none"
              />
              <circle cx={CX} cy={114} r={3} fill="#f5c542" />
            </g>
          )}
        </g>
      )}

      {/* Cabeza */}
      <circle cx={CX - 29} cy={65} r={6} fill={skin} />
      <circle cx={CX + 29} cy={65} r={6} fill={skin} />
      <circle cx={CX} cy={62} r={30} fill={skin} />

      {/* Barba (debajo de la boca) */}
      {avatar.facial === 'stubble' && (
        <path
          d={`M${CX - 25},66 Q${CX - 24},94 ${CX},94 Q${CX + 24},94 ${CX + 25},66 Q${CX + 18},84 ${CX},84 Q${CX - 18},84 ${CX - 25},66 Z`}
          fill={hair}
          opacity={0.3}
        />
      )}
      {avatar.facial === 'beard' && (
        <path
          d={`M${CX - 28},60 Q${CX - 28},100 ${CX},101 Q${CX + 28},100 ${CX + 28},60 Q${CX + 22},84 ${CX + 9},81 Q${CX},86 ${CX - 9},81 Q${CX - 22},84 ${CX - 28},60 Z`}
          fill={hair}
        />
      )}

      {/* Cara */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <ellipse cx={CX + side * 11} cy={63} rx={3.3} ry={4.2} fill={INK} />
          <circle cx={CX + side * 11 + 1.2} cy={61.4} r={1.2} fill="#fff" />
          <path
            d={`M${CX + side * 7},${53} Q${CX + side * 11},${50.5} ${CX + side * 15},${53}`}
            stroke={avatar.hair === 'bald' ? INK : hair}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={CX + side * 19} cy={72} r={4} fill="#f87171" opacity={0.22} />
        </g>
      ))}
      <path
        d={`M${CX - 7},75 Q${CX},${81 + 2 * ((c + a) / 2)} ${CX + 7},75`}
        stroke="#7a3b2e"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      {avatar.facial === 'mustache' && (
        <path
          d={`M${CX - 11},75 Q${CX - 5},68 ${CX},72 Q${CX + 5},68 ${CX + 11},75 Q${CX},72 ${CX - 11},75 Z`}
          fill={hair}
        />
      )}

      {/* Pelo */}
      {avatar.hair === 'short' && (
        <path
          d={`M${CX - 31},60 Q${CX - 34},26 ${CX},27 Q${CX + 34},26 ${CX + 31},60 Q${CX + 27},45 ${CX + 13},43 Q${CX},49 ${CX - 14},41 Q${CX - 27},45 ${CX - 31},60 Z`}
          fill={hair}
        />
      )}
      {avatar.hair === 'buzz' && (
        <path
          d={`M${CX - 30},56 Q${CX - 30},30 ${CX},30 Q${CX + 30},30 ${CX + 30},56 Q${CX},40 ${CX - 30},56 Z`}
          fill={hair}
          opacity={0.8}
        />
      )}
      {avatar.hair === 'curly' &&
        [
          [-25, 46],
          [-16, 35],
          [-3, 30],
          [10, 31],
          [21, 38],
          [27, 50],
          [-29, 57],
          [30, 60],
        ].map(([dx, cy], i) => <circle key={i} cx={CX + dx!} cy={cy} r={10} fill={hair} />)}
      {(avatar.hair === 'long' || avatar.hair === 'bun') && (
        <path
          d={`M${CX - 31},62 Q${CX - 33},27 ${CX},28 Q${CX + 33},27 ${CX + 31},62 Q${CX + 24},40 ${CX},42 Q${CX - 24},40 ${CX - 31},62 Z`}
          fill={hair}
        />
      )}
      {avatar.hair === 'bun' && <circle cx={CX} cy={26} r={11} fill={hair} />}
      {avatar.hair === 'mohawk' && (
        <>
          <path
            d={`M${CX - 29},56 Q${CX - 29},32 ${CX},32 Q${CX + 29},32 ${CX + 29},56 Q${CX},42 ${CX - 29},56 Z`}
            fill={hair}
            opacity={0.3}
          />
          <path
            d={`M${CX - 8},50 Q${CX - 11},16 ${CX},12 Q${CX + 11},16 ${CX + 8},50 Z`}
            fill={hair}
          />
        </>
      )}
      {avatar.hair === 'bald' && (
        <ellipse cx={CX - 9} cy={42} rx={9} ry={5} fill="#fff" opacity={0.22} />
      )}

      {/* Accesorios de la cabeza */}
      {avatar.accessory === 'headband' && (
        <path
          d={`M${CX - 30},49 Q${CX},38 ${CX + 30},49 L${CX + 30},56 Q${CX},45 ${CX - 30},56 Z`}
          fill="#a3e635"
        />
      )}
      {avatar.accessory === 'cap' && (
        <>
          <path
            d={`M${CX - 31},52 Q${CX - 31},20 ${CX},20 Q${CX + 31},20 ${CX + 31},52 Z`}
            fill={shirt}
          />
          <ellipse cx={CX + 12} cy={52} rx={26} ry={5.5} fill={shirt} />
          <ellipse cx={CX + 12} cy={51} rx={26} ry={3} fill="rgb(0 0 0 / 0.18)" />
        </>
      )}
      {avatar.accessory === 'glasses' && (
        <g stroke={INK} strokeWidth={2.4} fill="rgb(255 255 255 / 0.12)">
          <rect x={CX - 19} y={56} width={15} height={13} rx={5} />
          <rect x={CX + 4} y={56} width={15} height={13} rx={5} />
          <path d={`M${CX - 4},61 Q${CX},58 ${CX + 4},61`} fill="none" />
        </g>
      )}
    </svg>
  )
})
