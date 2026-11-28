// Genera los íconos de la PWA, el favicon y las pantallas de inicio de iOS a partir
// de la geometría del logo. Sin dependencias: rasteriza los trazos y codifica PNG a mano.
// Uso: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')

// ---- Geometría del logo (grilla de 24×24, igual que src/components/brand/Logo.tsx) ----
const STROKE = 2.5
const SHAPES = [
  // Pico exterior: la "A"
  {
    points: [
      [3.75, 20.25],
      [12, 4],
      [20.25, 20.25],
    ],
    color: [244, 244, 245],
  },
  // Chevron interior ascendente: el acento violeta
  {
    points: [
      [9, 19],
      [12, 13.75],
      [15, 19],
    ],
    color: [250, 204, 21],
  },
]
const BG = [14, 11, 22]

// ---- PNG ----
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function encodePng(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- Rasterizado ----
function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
function shapeAt(x, y) {
  // Devuelve el color del trazo que cubre el punto (en coordenadas de la grilla 24×24).
  for (let i = SHAPES.length - 1; i >= 0; i--) {
    const { points, color } = SHAPES[i]
    for (let s = 0; s < points.length - 1; s++) {
      if (distToSegment(x, y, points[s], points[s + 1]) <= STROKE / 2) return color
    }
  }
  return null
}

/**
 * @param {number} width
 * @param {number} height
 * @param {{ logoSize: number, glow?: boolean }} opts logoSize en px (lado de la grilla 24×24)
 */
function render(width, height, { logoSize, glow = false }) {
  const rgb = Buffer.alloc(width * height * 3)
  const cx = width / 2
  const cy = height / 2
  const scale = logoSize / 24
  const ox = cx - logoSize / 2
  const oy = cy - logoSize / 2
  const SS = 4 // supersampling 4×4

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let base = BG
      if (glow) {
        // Brillo violeta muy sutil detrás del logo
        const d = Math.hypot(x - cx, y - cy * 0.9) / (width * 0.6)
        const a = Math.max(0, 1 - d) ** 2 * 0.28
        base = BG.map((c, i) => c + ([124, 58, 237][i] - c) * a)
      }
      let r = 0,
        g = 0,
        b = 0
      const inBox = x >= ox - 2 && x <= ox + logoSize + 2 && y >= oy - 2 && y <= oy + logoSize + 2
      if (inBox) {
        for (let sy = 0; sy < SS; sy++) {
          for (let sx = 0; sx < SS; sx++) {
            const gx = (x + (sx + 0.5) / SS - ox) / scale
            const gy = (y + (sy + 0.5) / SS - oy) / scale
            const c = shapeAt(gx, gy) ?? base
            r += c[0]
            g += c[1]
            b += c[2]
          }
        }
        const n = SS * SS
        r /= n
        g /= n
        b /= n
      } else {
        ;[r, g, b] = base
      }
      const o = (y * width + x) * 3
      rgb[o] = Math.round(r)
      rgb[o + 1] = Math.round(g)
      rgb[o + 2] = Math.round(b)
    }
  }
  return encodePng(width, height, rgb)
}

function write(rel, data) {
  const file = join(PUBLIC, rel)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, data)
  console.log('✓', rel)
}

// ---- Íconos ----
write('icons/icon-192.png', render(192, 192, { logoSize: 120, glow: true }))
write('icons/icon-512.png', render(512, 512, { logoSize: 320, glow: true }))
// Maskable: el contenido tiene que entrar en el 80% central
write('icons/icon-maskable-512.png', render(512, 512, { logoSize: 250, glow: true }))
write('apple-touch-icon.png', render(180, 180, { logoSize: 112, glow: true }))

// ---- Favicon SVG ----
const svgPaths = SHAPES.map(
  ({ points, color }) =>
    `<polyline points="${points.map((p) => p.join(',')).join(' ')}" stroke="rgb(${color.join(',')})"/>`,
).join('')
write(
  'favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0E0B16"/><g fill="none" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${svgPaths}</g></svg>\n`,
)

// ---- Pantallas de inicio de iOS (apple-touch-startup-image) ----
// Mismo fondo y logo (72 pt) que el primer cuadro del splash animado: la transición no se nota.
export const STARTUP_DEVICES = [
  // [ancho pt, alto pt, densidad]
  [440, 956, 3], // 16/17 Pro Max
  [402, 874, 3], // 16/17 Pro
  [420, 912, 3], // Air
  [430, 932, 3], // 14 Pro Max, 15/16 Plus, 15 Pro Max
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 13, 14
  [375, 812, 3], // X, XS, 11 Pro, 12/13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [375, 667, 2], // SE
]
for (const [w, h, d] of STARTUP_DEVICES) {
  write(`splash/startup-${w * d}x${h * d}.png`, render(w * d, h * d, { logoSize: 72 * d }))
}
