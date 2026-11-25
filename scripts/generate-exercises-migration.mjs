// Convierte ejercicios-base.csv en la migración de ejercicios globales.
// Cada ejercicio recibe un UUID determinístico (v5 a partir del nombre) para que su id no cambie
// aunque se regenere el archivo: así las rutinas y el historial nunca pierden la referencia.
// Uso: npm run seed:exercises
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CSV = join(ROOT, 'ejercicios-base.csv')
const OUT = join(ROOT, 'supabase/migrations/0002_global_exercises.sql')

// Namespace propio de ASCEND para los UUID v5 de los ejercicios globales. No cambiar.
const NAMESPACE = 'c0a1e7d4-5b2f-4f3e-9a61-8d2b7e4f1a90'

const MUSCLES = {
  pecho: 'chest',
  espalda: 'back',
  hombros: 'shoulders',
  bíceps: 'biceps',
  tríceps: 'triceps',
  antebrazos: 'forearms',
  cuádriceps: 'quads',
  isquiotibiales: 'hamstrings',
  glúteos: 'glutes',
  gemelos: 'calves',
  abdominales: 'abs',
}
const EQUIPMENT = {
  barra: 'barbell',
  mancuernas: 'dumbbell',
  máquina: 'machine',
  polea: 'cable',
  'peso corporal': 'bodyweight',
  kettlebell: 'kettlebell',
  banda: 'band',
  smith: 'smith',
  otro: 'other',
}
// Ejercicios que se registran por tiempo en vez de repeticiones.
const TIMED = new Set(['plancha'])

function uuidv5(name, namespace) {
  const ns = Buffer.from(namespace.replace(/-/g, ''), 'hex')
  const hash = createHash('sha1')
    .update(Buffer.concat([ns, Buffer.from(name, 'utf8')]))
    .digest()
  hash[6] = (hash[6] & 0x0f) | 0x50
  hash[8] = (hash[8] & 0x3f) | 0x80
  const h = hash.subarray(0, 16).toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const sql = (s) => `'${s.replace(/'/g, "''")}'`

const lines = readFileSync(CSV, 'utf8').trim().split(/\r?\n/)
const header = lines.shift()
if (header !== 'nombre,grupo,equipamiento') throw new Error(`Encabezado inesperado: ${header}`)

const seen = new Set()
const rows = lines.map((line, i) => {
  const [name, group, equipment, ...rest] = line.split(',').map((s) => s.trim())
  if (rest.length || !name) throw new Error(`Línea ${i + 2} inválida: ${line}`)
  const muscle = MUSCLES[group.toLowerCase()]
  const equip = EQUIPMENT[equipment.toLowerCase()]
  if (!muscle) throw new Error(`Grupo desconocido en línea ${i + 2}: ${group}`)
  if (!equip) throw new Error(`Equipamiento desconocido en línea ${i + 2}: ${equipment}`)
  const key = name.toLowerCase()
  if (seen.has(key)) throw new Error(`Ejercicio duplicado: ${name}`)
  seen.add(key)
  const type = TIMED.has(key) ? 'timed' : equip === 'bodyweight' ? 'bodyweight' : 'weighted'
  return `  (${sql(uuidv5(key, NAMESPACE))}, ${sql(name)}, ${sql(muscle)}, ${sql(equip)}, ${sql(type)})`
})

const out = `-- =============================================================================
-- ASCEND — 0002_global_exercises
-- Biblioteca global de ejercicios (owner_user_id = null), generada desde ejercicios-base.csv
-- con scripts/generate-exercises-migration.mjs. NO editar a mano: editá el CSV y regenerá
-- en una migración nueva.
-- Va como migración (y no en seed.sql) porque \`supabase db push\` no corre el seed en remoto.
-- =============================================================================

insert into public.exercises (id, name, primary_muscle, equipment, exercise_type)
values
${rows.join(',\n')}
on conflict (id) do update set
  name           = excluded.name,
  primary_muscle = excluded.primary_muscle,
  equipment      = excluded.equipment,
  exercise_type  = excluded.exercise_type;
`

writeFileSync(OUT, out)
console.log(`✓ ${rows.length} ejercicios → ${OUT.replace(ROOT + '/', '')}`)
