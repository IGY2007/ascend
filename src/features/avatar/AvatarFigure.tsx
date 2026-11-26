import { memo, useId } from 'react'
import {
  EMPTY_BODY,
  HAIR_COLORS,
  SHIRT_COLORS,
  SHOES_COLORS,
  SHORTS_COLORS,
  SKINS,
  type AvatarConfig,
  type Body,
} from '@/domain/avatar'
import { cn } from '@/lib/utils'

const CX = 100
const INK = '#1f1a17'
const GOLD = '#e6b422'
const SHADE = 'rgb(0 0 0 / 0.15)'

interface Props {
  avatar: AvatarConfig
  /** Crecimiento de cada grupo (0–1). Sin datos: cuerpo base. */
  body?: Body
  /** 'head' recorta solo la cara (para chips y avatares chicos). */
  variant?: 'full' | 'head'
  /** Número de la camiseta (ej.: el nivel). */
  jerseyNumber?: number
  /** Altura real: el personaje se ve más alto o más bajo (150–200 cm). */
  heightCm?: number | null
  /** Contorno tipo sticker (estilo cartoon). */
  outlined?: boolean
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
  jerseyNumber = 1,
  heightCm,
  outlined = true,
  className,
  title,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const skin = SKINS[avatar.skin] ?? SKINS[2]
  const hair = HAIR_COLORS[avatar.hairColor] ?? HAIR_COLORS[1]
  const shirt = SHIRT_COLORS[avatar.shirtColor] ?? SHIRT_COLORS[0]
  const shorts = SHORTS_COLORS[avatar.shortsColor] ?? SHORTS_COLORS[0]
  const shoes = SHOES_COLORS[avatar.shoesColor] ?? SHOES_COLORS[0]
  const female = avatar.body === 'female'
  const { chest: c, back: b, shoulders: s, arms: a, legs: l, calves: k, core: o } = body

  // Proporciones: en V para él, reloj de arena para ella. Todo crece con lo entrenado.
  const tw = female ? 21 + 6 * c + 7 * b : 25 + 9 * c + 10 * b
  const ww = female ? 17 + 2 * b : 21 + 2 * b
  const hw = female ? 25 + 4 * l : ww + 1 // cadera
  const delt = female ? 7 + 6 * s : 8 + 8 * s
  const ua = female ? 9 + 8 * a : 10 + 11 * a
  const fa = female ? 7 + 4 * a : 8 + 5 * a
  const armX = tw + 3 + ua * 0.35
  const lt = 13 + 17 * l + (female ? 3 : 0)
  const lx = Math.max(8 + lt * 0.45, female ? hw - lt / 2 - 1 : 0)
  const cw = 9 + 11 * k
  const neck = female ? 7 : 8 + 3 * ((s + b) / 2)

  const torso = female
    ? `M${CX - tw},104 Q${CX - tw - 1},124 ${CX - ww},148 Q${CX - ww - 3},166 ${CX - hw},178 L${CX + hw},178 Q${CX + ww + 3},166 ${CX + ww},148 Q${CX + tw + 1},124 ${CX + tw},104 Q${CX},98 ${CX - tw},104 Z`
    : `M${CX - tw},104 Q${CX - tw - 3},140 ${CX - ww},178 L${CX + ww},178 Q${CX + tw + 3},140 ${CX + tw},104 Q${CX},97 ${CX - tw},104 Z`

  const outfit = avatar.outfit
  const covered = outfit === 'tee' || outfit === 'hoodie' || outfit === 'jersey'
  const showsBelly = outfit === 'shirtless' || outfit === 'sportsbra'
  const viewBox = variant === 'head' ? '58 18 84 84' : '0 0 200 310'
  // 175 cm = tamaño de referencia; escala desde los pies
  const scale =
    variant === 'full' && heightCm
      ? Math.min(1.08, Math.max(0.86, 1 + (heightCm - 175) * 0.0045))
      : 1
  const full = variant === 'full'

  return (
    <svg
      viewBox={viewBox}
      className={cn('block', className)}
      role="img"
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <clipPath id={`${uid}-torso`}>
          <path d={torso} />
        </clipPath>
        <filter id={`${uid}-o`} x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology operator="dilate" radius={2} in="SourceAlpha" result="d" />
          <feFlood floodColor="#f4f4f5" />
          <feComposite in2="d" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`${uid}-aura`}>
          <stop offset="0%" stopColor="#a3e635" stopOpacity={0.55} />
          <stop offset="55%" stopColor="#8b5cf6" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Aura: detrás de todo y sin contorno */}
      {full && avatar.extra === 'aura' && (
        <ellipse cx={CX} cy={160} rx={95} ry={150} fill={`url(#${uid}-aura)`} />
      )}
      <g
        transform={
          scale === 1 ? undefined : `translate(100 300) scale(${scale}) translate(-100 -300)`
        }
        filter={outlined ? `url(#${uid}-o)` : undefined}
      >
        {/* Aura y capa: detrás de todo */}
        {full && avatar.extra === 'cape' && (
          <path
            d={`M${CX - tw + 3},102 L${CX + tw - 3},102 L${CX + tw + 22},252 Q${CX},266 ${CX - tw - 22},252 Z`}
            fill="#dc2626"
          />
        )}

        {/* Pelo que va detrás de la cabeza */}
        {avatar.hair === 'long' && (
          <path
            d={`M${CX - 32},60 Q${CX - 38},112 ${CX - 22},122 L${CX + 22},122 Q${CX + 38},112 ${CX + 32},60 Z`}
            fill={hair}
          />
        )}
        {avatar.hair === 'afro' && <circle cx={CX} cy={52} r={41} fill={hair} />}
        {avatar.hair === 'ponytail' && (
          <path
            d={`M${CX + 20},38 Q${CX + 50},44 ${CX + 42},96 Q${CX + 34},78 ${CX + 26},56 Z`}
            fill={hair}
          />
        )}
        {avatar.hair === 'braids' &&
          [-1, 1].map((side) =>
            [0, 1, 2, 3, 4].map((i) => (
              <circle
                key={`${side}${i}`}
                cx={CX + side * (27 + i * 0.6)}
                cy={74 + i * 10}
                r={6 - i * 0.3}
                fill={hair}
              />
            )),
          )}

        {full && (
          <g>
            {/* Piernas, medias y zapatillas */}
            {[-1, 1].map((side) => {
              const x = CX + side * lx
              const fx = CX + side * (lx + 2)
              return (
                <g key={side}>
                  <ellipse cx={x} cy={230} rx={lt / 2} ry={26} fill={skin} />
                  <ellipse
                    cx={CX + side * (lx + cw * 0.12)}
                    cy={265}
                    rx={cw / 2}
                    ry={18}
                    fill={skin}
                  />
                  <rect x={fx - 5} y={270} width={10} height={14} rx={4} fill={skin} />
                  <rect x={fx - 5.5} y={277} width={11} height={8} rx={2} fill="#f4f4f5" />
                  <path
                    d={`M${fx - 11},${295} Q${fx - 12},${283} ${fx - 4},${282} L${fx + 4},${282} Q${fx + 13},${284} ${fx + 12},${295} Z`}
                    fill={shoes}
                  />
                  <rect
                    x={fx - 12.5}
                    y={293}
                    width={25}
                    height={5}
                    rx={2.5}
                    fill={avatar.shoesColor === 0 ? '#a3e635' : '#f4f4f5'}
                  />
                  <path
                    d={`M${fx - 3.5},${286} L${fx + 3.5},${286} M${fx - 3.5},${289} L${fx + 3.5},${289}`}
                    stroke={avatar.shoesColor === 0 ? '#a1a1aa' : 'rgb(255 255 255 / 0.6)'}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                  />
                </g>
              )
            })}

            {/* Short */}
            <path
              d={`M${CX - hw - 1},172 L${CX + hw + 1},172 L${CX + lx + lt / 2 + 3},216 L${CX + 2},216 L${CX},200 L${CX - 2},216 L${CX - lx - lt / 2 - 3},216 Z`}
              fill={shorts}
            />
            <rect
              x={CX - hw - 1}
              y={171}
              width={(hw + 1) * 2}
              height={6}
              rx={3}
              fill="rgb(255 255 255 / 0.14)"
            />

            {/* Brazos */}
            {[-1, 1].map((side) => (
              <g key={side}>
                <ellipse
                  cx={CX + side * armX}
                  cy={132}
                  rx={ua / 2}
                  ry={22}
                  fill={outfit === 'hoodie' ? shirt : skin}
                />
                {a > 0.25 && outfit !== 'hoodie' && (
                  <path
                    d={`M${CX + side * (armX - ua * 0.3)},122 Q${CX + side * (armX - ua * 0.65)},132 ${CX + side * (armX - ua * 0.3)},142`}
                    stroke={SHADE}
                    strokeWidth={1.6}
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
                <ellipse cx={CX + side * (armX + 1)} cy={168} rx={fa / 2} ry={19} fill={skin} />
                {avatar.extra === 'wristbands' && (
                  <rect
                    x={CX + side * (armX + 1.5) - fa / 2 - 1}
                    y={180}
                    width={fa + 2}
                    height={6}
                    rx={2.5}
                    fill="#a3e635"
                  />
                )}
                <circle cx={CX + side * (armX + 1.5)} cy={190} r={6 + a * 1.5} fill={skin} />
              </g>
            ))}

            {/* Capucha (detrás del cuello) */}
            {outfit === 'hoodie' && (
              <path
                d={`M${CX - 22},104 Q${CX - 26},86 ${CX},84 Q${CX + 26},86 ${CX + 22},104 Z`}
                fill={shirt}
              />
            )}

            {/* Cuello y torso */}
            <rect x={CX - neck} y={84} width={neck * 2} height={22} rx={6} fill={skin} />
            <path d={torso} fill={skin} />

            {/* Pecho y abdomen a la vista */}
            {showsBelly && (
              <g stroke={SHADE} strokeWidth={1.6} fill="none" strokeLinecap="round">
                {outfit === 'shirtless' &&
                  [-1, 1].map((side) => (
                    <path
                      key={side}
                      d={`M${CX + side * 2},114 Q${CX + side * tw * 0.6},${110 + 4 * c} ${CX + side * (tw - 5)},120 M${CX + side * 2},114 L${CX + side * 2},${126 + 4 * c} Q${CX + side * tw * 0.5},${132 + 5 * c} ${CX + side * (tw - 6)},${124 + 2 * c}`}
                      opacity={0.4 + 0.6 * c}
                    />
                  ))}
                {o > 0.15 &&
                  [0, 1, 2].map((row) =>
                    female && row === 0 ? null : (
                      <g key={row} opacity={Math.min(1, o * 1.4)}>
                        <rect x={CX - 10} y={140 + row * 11} width={8} height={8} rx={3} />
                        <rect x={CX + 2} y={140 + row * 11} width={8} height={8} rx={3} />
                      </g>
                    ),
                  )}
                <circle cx={CX} cy={170} r={1.4} fill="rgb(0 0 0 / 0.25)" stroke="none" />
              </g>
            )}

            {/* Ropa del torso (recortada a la forma del cuerpo) */}
            <g clipPath={`url(#${uid}-torso)`}>
              {outfit === 'tank' && (
                <path
                  d={`M${CX - tw + 7},95 L${CX - 11},95 Q${CX},118 ${CX + 11},95 L${CX + tw - 7},95 L${CX + tw + 12},200 L${CX - tw - 12},200 Z`}
                  fill={shirt}
                />
              )}
              {outfit === 'sportsbra' && (
                <path
                  d={`M${CX - tw + 6},95 L${CX - 9},95 Q${CX},114 ${CX + 9},95 L${CX + tw - 6},95 L${CX + tw + 8},131 L${CX - tw - 8},131 Z`}
                  fill={shirt}
                />
              )}
              {covered && <rect x={0} y={90} width={200} height={120} fill={shirt} />}
              {outfit === 'jersey' && (
                <>
                  <rect x={0} y={96} width={200} height={7} fill="rgb(255 255 255 / 0.35)" />
                  <text
                    x={CX}
                    y={150}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={800}
                    fontFamily="Inter, system-ui, sans-serif"
                    fill="rgb(255 255 255 / 0.9)"
                  >
                    {jerseyNumber}
                  </text>
                </>
              )}
              {outfit === 'hoodie' && (
                <>
                  <rect x={CX - 16} y={150} width={32} height={18} rx={6} fill={SHADE} />
                  <path
                    d={`M${CX - 5},104 L${CX - 6},124 M${CX + 5},104 L${CX + 6},124`}
                    stroke="#f4f4f5"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                </>
              )}
            </g>
            {covered && (
              <path
                d={`M${CX - 10},100 Q${CX},112 ${CX + 10},100`}
                stroke={SHADE}
                strokeWidth={2}
                fill="none"
              />
            )}
            {(outfit !== 'shirtless' || female) && c > 0.3 && (
              <path
                d={`M${CX - tw * 0.7},${128 + 3 * c} Q${CX - tw * 0.35},${136 + 3 * c} ${CX - 3},${128 + 2 * c} M${CX + 3},${128 + 2 * c} Q${CX + tw * 0.35},${136 + 3 * c} ${CX + tw * 0.7},${128 + 3 * c}`}
                stroke={SHADE}
                strokeWidth={1.6}
                fill="none"
                strokeLinecap="round"
              />
            )}

            {/* Hombros; con remera/buzo los tapa la manga */}
            {[-1, 1].map((side) => (
              <circle
                key={side}
                cx={CX + side * (tw - 1)}
                cy={109}
                r={delt}
                fill={covered ? shirt : skin}
              />
            ))}
            {outfit === 'jersey' &&
              [-1, 1].map((side) => (
                <path
                  key={side}
                  d={`M${CX + side * (tw - 1 - delt * 0.7)},${109 + delt * 0.6} Q${CX + side * (tw - 1)},${109 + delt * 0.95} ${CX + side * (tw - 1 + delt * 0.7)},${109 + delt * 0.6}`}
                  stroke="rgb(255 255 255 / 0.5)"
                  strokeWidth={2}
                  fill="none"
                />
              ))}

            {/* Cadena y medalla */}
            {avatar.extra === 'chain' && (
              <g>
                <path
                  d={`M${CX - neck - 1},100 Q${CX},118 ${CX + neck + 1},100`}
                  stroke={GOLD}
                  strokeWidth={2.4}
                  fill="none"
                />
                <circle cx={CX} cy={114} r={3} fill={GOLD} />
              </g>
            )}
            {avatar.extra === 'medal' && (
              <g>
                <path
                  d={`M${CX - 8},98 L${CX},126 L${CX + 8},98`}
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fill="none"
                />
                <circle cx={CX} cy={130} r={7} fill={GOLD} stroke="#b8860b" strokeWidth={1.2} />
                <path
                  d={`M${CX},126 L${CX + 1.6},129 L${CX + 4.6},129.3 L${CX + 2.3},131.3 L${CX + 3},134.4 L${CX},132.8 L${CX - 3},134.4 L${CX - 2.3},131.3 L${CX - 4.6},129.3 L${CX - 1.6},129 Z`}
                  fill="#fff6c7"
                />
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
        {avatar.facial === 'goatee' && (
          <path d={`M${CX - 7},83 Q${CX},98 ${CX + 7},83 Q${CX},88 ${CX - 7},83 Z`} fill={hair} />
        )}

        {/* Ojos */}
        {[-1, 1].map((side) => {
          const ex = CX + side * 11
          return (
            <g key={side}>
              {avatar.eyes === 'happy' ? (
                <path
                  d={`M${ex - 4},65 Q${ex},59 ${ex + 4},65`}
                  stroke={INK}
                  strokeWidth={2.6}
                  fill="none"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <ellipse cx={ex} cy={63} rx={3.3} ry={4.2} fill={INK} />
                  <circle cx={ex + 1.2} cy={61.4} r={1.2} fill="#fff" />
                </>
              )}
              {avatar.eyes === 'lashes' && (
                <path
                  d={`M${ex + side * 2.6},59.4 L${ex + side * 5.4},57.2 M${ex + side * 3.4},61.4 L${ex + side * 6.4},60.4`}
                  stroke={INK}
                  strokeWidth={1.4}
                  strokeLinecap="round"
                />
              )}
              {avatar.eyes === 'focused' && (
                <path
                  d={`M${ex - 4.5},62.2 L${ex + 4.5},62.2 L${ex + 4.5},57 L${ex - 4.5},57 Z`}
                  fill={skin}
                />
              )}
              <path
                d={
                  avatar.eyes === 'focused'
                    ? `M${ex - side * 4},${54} L${ex + side * 4},${56.5}`
                    : `M${ex - 4},${53} Q${ex},${50.5} ${ex + 4},${53}`
                }
                stroke={['bald', 'buzz'].includes(avatar.hair) ? INK : hair}
                strokeWidth={2.2}
                fill="none"
                strokeLinecap="round"
              />
              <circle cx={CX + side * 19} cy={72} r={4} fill="#f87171" opacity={0.22} />
            </g>
          )
        })}
        <path
          d={`M${CX - 7},75 Q${CX},${81 + 2 * ((c + a) / 2)} ${CX + 7},75`}
          stroke={female ? '#be4b5a' : '#7a3b2e'}
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
        {avatar.hair === 'sidepart' && (
          <path
            d={`M${CX - 31},60 Q${CX - 34},24 ${CX + 4},25 Q${CX + 35},27 ${CX + 31},60 Q${CX + 28},44 ${CX + 19},40 Q${CX + 2},45 ${CX - 12},36 Q${CX - 27},44 ${CX - 31},60 Z`}
            fill={hair}
          />
        )}
        {(avatar.hair === 'buzz' || avatar.hair === 'afro') && (
          <path
            d={`M${CX - 30},56 Q${CX - 30},30 ${CX},30 Q${CX + 30},30 ${CX + 30},56 Q${CX},40 ${CX - 30},56 Z`}
            fill={hair}
            opacity={avatar.hair === 'buzz' ? 0.8 : 1}
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
        {['long', 'bun', 'ponytail', 'braids'].includes(avatar.hair) && (
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
        {avatar.hair === 'spiky' && (
          <path
            d={`M${CX - 31},58 L${CX - 30},32 L${CX - 21},40 L${CX - 15},20 L${CX - 6},35 L${CX},14 L${CX + 6},35 L${CX + 15},20 L${CX + 21},40 L${CX + 30},32 L${CX + 31},58 Q${CX},40 ${CX - 31},58 Z`}
            fill={hair}
          />
        )}
        {avatar.hair === 'bald' && (
          <ellipse cx={CX - 9} cy={42} rx={9} ry={5} fill="#fff" opacity={0.22} />
        )}

        {/* Cabeza: accesorios */}
        {avatar.headwear === 'headband' && (
          <path
            d={`M${CX - 30},49 Q${CX},38 ${CX + 30},49 L${CX + 30},56 Q${CX},45 ${CX - 30},56 Z`}
            fill="#a3e635"
          />
        )}
        {avatar.headwear === 'cap' && (
          <>
            <path
              d={`M${CX - 31},52 Q${CX - 31},20 ${CX},20 Q${CX + 31},20 ${CX + 31},52 Z`}
              fill={shirt}
            />
            <ellipse cx={CX + 12} cy={52} rx={26} ry={5.5} fill={shirt} />
            <ellipse cx={CX + 12} cy={51} rx={26} ry={3} fill="rgb(0 0 0 / 0.18)" />
          </>
        )}
        {avatar.headwear === 'beanie' && (
          <>
            <path
              d={`M${CX - 31},54 Q${CX - 32},20 ${CX},20 Q${CX + 32},20 ${CX + 31},54 Z`}
              fill={shirt}
            />
            <rect x={CX - 32} y={45} width={64} height={11} rx={5} fill={shirt} />
            <rect x={CX - 32} y={45} width={64} height={11} rx={5} fill="rgb(0 0 0 / 0.15)" />
            <circle cx={CX} cy={18} r={6} fill="#f4f4f5" />
          </>
        )}
        {avatar.headwear === 'headphones' && (
          <>
            <path
              d={`M${CX - 31},62 Q${CX - 35},20 ${CX},21 Q${CX + 35},20 ${CX + 31},62`}
              stroke="#27272a"
              strokeWidth={5}
              fill="none"
            />
            {[-1, 1].map((side) => (
              <g key={side}>
                <rect x={CX + side * 32 - 6} y={55} width={12} height={19} rx={5} fill="#27272a" />
                <circle cx={CX + side * 32} cy={64.5} r={3} fill="#8b5cf6" />
              </g>
            ))}
          </>
        )}
        {avatar.headwear === 'crown' && (
          <g>
            <path
              d={`M${CX - 18},36 L${CX - 19},19 L${CX - 9},28 L${CX},14 L${CX + 9},28 L${CX + 19},19 L${CX + 18},36 Z`}
              fill={GOLD}
              stroke="#b8860b"
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
            <circle cx={CX} cy={30} r={2.6} fill="#ef4444" />
            <circle cx={CX - 11} cy={31} r={2} fill="#3b82f6" />
            <circle cx={CX + 11} cy={31} r={2} fill="#a3e635" />
          </g>
        )}

        {/* Anteojos */}
        {avatar.eyewear === 'glasses' && (
          <g stroke={INK} strokeWidth={2.4} fill="rgb(255 255 255 / 0.12)">
            <rect x={CX - 19} y={56} width={15} height={13} rx={5} />
            <rect x={CX + 4} y={56} width={15} height={13} rx={5} />
            <path d={`M${CX - 4},61 Q${CX},58 ${CX + 4},61`} fill="none" />
          </g>
        )}
        {avatar.eyewear === 'sunglasses' && (
          <g>
            <path
              d={`M${CX - 21},57 L${CX - 2},57 L${CX - 4},67 Q${CX - 11},71 ${CX - 18},67 Z M${CX + 2},57 L${CX + 21},57 L${CX + 18},67 Q${CX + 11},71 ${CX + 4},67 Z`}
              fill="#111"
            />
            <path d={`M${CX - 2},58 L${CX + 2},58`} stroke="#111" strokeWidth={2.4} />
            <path
              d={`M${CX - 17},59.5 L${CX - 13},59.5 M${CX + 6},59.5 L${CX + 10},59.5`}
              stroke="#fff"
              strokeWidth={1.4}
              opacity={0.5}
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    </svg>
  )
})
