let last = 0

/**
 * Hora ISO estrictamente creciente: dos registros creados en el mismo milisegundo (ej.: doble
 * toque en "+250 ml") igual quedan ordenados, así "deshacer el último" borra el correcto.
 */
export function monotonicNowIso(): string {
  const now = Date.now()
  last = now > last ? now : last + 1
  return new Date(last).toISOString()
}
