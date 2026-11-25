/**
 * Convierte un texto ingresado por el usuario en número.
 * Acepta coma o punto como separador decimal ("69,5" y "69.5").
 * Devuelve null si el texto está vacío o no es un número válido.
 */
export function parseDecimal(input: string): number | null {
  const normalized = input.trim().replace(/\s+/g, '').replace(',', '.')
  if (normalized === '') return null
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

/** Igual que parseDecimal pero solo acepta enteros. */
export function parseInteger(input: string): number | null {
  const normalized = input.trim()
  if (!/^-?\d+$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isSafeInteger(value) ? value : null
}

/** Formatea un número para mostrarlo in English (decimal point), sin ceros sobrantes. */
export function formatDecimal(value: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
    useGrouping: true,
  }).format(value)
}

/** Con signo explícito y el signo menos tipográfico (−), ej.: "+0,4" / "−1,2" / "0". */
export function formatSigned(value: number, maxFractionDigits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return sign + formatDecimal(Math.abs(value), maxFractionDigits)
}
