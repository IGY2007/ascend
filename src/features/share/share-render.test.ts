import { describe, expect, it } from 'vitest'
import { overlayRect, type ShareData } from './share-render'

const data: ShareData = {
  title: 'Pecho y tríceps',
  subtitle: 'jueves',
  stats: [
    { label: 'Tiempo', value: '58 min' },
    { label: 'Volumen', value: '6.250 kg' },
    { label: 'Series', value: '18' },
  ],
}

describe('imagen para compartir', () => {
  it('el bloque se centra donde lo dejaste y escala con el tamaño', () => {
    const base = { layout: 'classic' as const, theme: 'clear' as const, x: 0.5, y: 0.5 }
    const a = overlayRect(1080, 1920, data, { ...base, scale: 1 })
    expect(a.x + a.w / 2).toBeCloseTo(540)
    expect(a.y + a.h / 2).toBeCloseTo(960)
    const b = overlayRect(1080, 1920, data, { ...base, scale: 1.5 })
    expect(b.w).toBeCloseTo(a.w * 1.5)
  })

  it('cada diseño tiene su forma', () => {
    const st = { theme: 'card' as const, x: 0.5, y: 0.5, scale: 1 }
    const classic = overlayRect(1080, 1920, data, { ...st, layout: 'classic' })
    const compact = overlayRect(1080, 1920, data, { ...st, layout: 'compact' })
    expect(classic.h).toBeGreaterThan(classic.w) // vertical, como Strava
    expect(compact.w).toBeGreaterThan(compact.h) // horizontal
  })
})
