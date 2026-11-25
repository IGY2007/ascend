import { describe, expect, it } from 'vitest'
import { formatDecimal, parseDecimal, parseInteger } from './numbers'

describe('parseDecimal', () => {
  it('acepta coma y punto como separador decimal', () => {
    expect(parseDecimal('69.5')).toBe(69.5)
    expect(parseDecimal('69.5')).toBe(69.5)
  })

  it('acepta enteros, espacios y decimales sin parte entera', () => {
    expect(parseDecimal('100')).toBe(100)
    expect(parseDecimal('  42,25 ')).toBe(42.25)
    expect(parseDecimal(',5')).toBe(0.5)
    expect(parseDecimal('80,')).toBe(80)
  })

  it('devuelve null para texto vacío o inválido', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('   ')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('1,2,3')).toBeNull()
    expect(parseDecimal('1.2.3')).toBeNull()
    expect(parseDecimal('12kg')).toBeNull()
  })
})

describe('parseInteger', () => {
  it('acepta solo enteros', () => {
    expect(parseInteger('8')).toBe(8)
    expect(parseInteger(' 12 ')).toBe(12)
    expect(parseInteger('8,5')).toBeNull()
    expect(parseInteger('')).toBeNull()
  })
})

describe('formatDecimal', () => {
  it('uses a decimal point and no muestra ceros sobrantes', () => {
    expect(formatDecimal(69.5)).toBe('69.5')
    expect(formatDecimal(70)).toBe('70')
    expect(formatDecimal(2.125, 2)).toBe('2.13')
    expect(formatDecimal(1250)).toBe('1,250')
  })
})

describe('formatSigned', () => {
  it('usa + y el signo menos tipográfico', async () => {
    const { formatSigned } = await import('./numbers')
    expect(formatSigned(0.4)).toBe('+0.4')
    expect(formatSigned(-1.25, 1)).toBe('−1.3')
    expect(formatSigned(0)).toBe('0')
  })
})
