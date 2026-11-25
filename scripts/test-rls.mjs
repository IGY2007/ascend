// Prueba de Row Level Security contra el proyecto de Supabase.
// Demuestra que el usuario B no puede leer ni modificar datos del usuario A.
//
// Requisitos (en .env.local o en el entorno):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
//   RLS_USER_A_EMAIL, RLS_USER_A_PASSWORD, RLS_USER_B_EMAIL, RLS_USER_B_PASSWORD
// Los dos usuarios tienen que existir (creálos desde la app). El script limpia lo que crea.
// Uso: npm run test:rls
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const env = (name) => {
  const value = process.env[name]
  if (!value) {
    console.error(
      `Falta la variable ${name}. Ver el comentario al principio de scripts/test-rls.mjs.`,
    )
    process.exit(2)
  }
  return value
}

const URL = env('VITE_SUPABASE_URL')
const KEY = env('VITE_SUPABASE_ANON_KEY')
const client = () =>
  createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })

async function signIn(prefix) {
  const c = client()
  const { data, error } = await c.auth.signInWithPassword({
    email: env(`${prefix}_EMAIL`),
    password: env(`${prefix}_PASSWORD`),
  })
  if (error) throw new Error(`No se pudo iniciar sesión como ${prefix}: ${error.message}`)
  return { c, id: data.user.id }
}

let failures = 0
function check(name, ok, detail = '') {
  if (ok) console.log(`  ✓ ${name}`)
  else {
    failures++
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}
const must = ({ error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`)
}

const a = await signIn('RLS_USER_A')
const b = await signIn('RLS_USER_B')
if (a.id === b.id) throw new Error('A y B tienen que ser usuarios distintos')

const { data: globalEx } = await a.c
  .from('exercises')
  .select('id')
  .is('owner_user_id', null)
  .limit(1)
  .single()
if (!globalEx) throw new Error('No hay ejercicios globales: ¿corriste las migraciones?')

// ---- Datos del usuario A ----
const ids = {
  exercise: randomUUID(),
  template: randomUUID(),
  templateExercise: randomUUID(),
  session: randomUUID(),
  sessionExercise: randomUUID(),
  set: randomUUID(),
  note: randomUUID(),
  sessionB: randomUUID(),
}
const tag = `rls-test-${Date.now()}`

try {
  console.log('Preparando datos del usuario A…')
  must(
    await a.c.from('exercises').insert({ id: ids.exercise, owner_user_id: a.id, name: tag }),
    'ejercicio A',
  )
  must(
    await a.c.from('workout_templates').insert({ id: ids.template, user_id: a.id, name: tag }),
    'rutina A',
  )
  must(
    await a.c.from('template_exercises').insert({
      id: ids.templateExercise,
      user_id: a.id,
      template_id: ids.template,
      exercise_id: globalEx.id,
    }),
    'ejercicio de rutina A',
  )
  must(
    await a.c.from('workout_sessions').insert({ id: ids.session, user_id: a.id, name: tag }),
    'sesión A',
  )
  must(
    await a.c.from('session_exercises').insert({
      id: ids.sessionExercise,
      user_id: a.id,
      session_id: ids.session,
      exercise_id: ids.exercise,
      exercise_name_snapshot: tag,
    }),
    'ejercicio de sesión A',
  )
  must(
    await a.c.from('exercise_sets').insert({
      id: ids.set,
      user_id: a.id,
      session_exercise_id: ids.sessionExercise,
      set_number: 1,
      weight_kg: 60,
      repetitions: 8,
    }),
    'serie A',
  )
  must(
    await a.c
      .from('exercise_user_notes')
      .insert({ id: ids.note, user_id: a.id, exercise_id: globalEx.id, notes: tag }),
    'nota A',
  )

  console.log('\nLectura (B no ve nada de A):')
  for (const [table, id] of [
    ['profiles', a.id],
    ['exercises', ids.exercise],
    ['workout_templates', ids.template],
    ['template_exercises', ids.templateExercise],
    ['workout_sessions', ids.session],
    ['session_exercises', ids.sessionExercise],
    ['exercise_sets', ids.set],
    ['exercise_user_notes', ids.note],
  ]) {
    const { data, error } = await b.c.from(table).select('id').eq('id', id)
    check(
      `${table}: 0 filas`,
      !error && data.length === 0,
      error?.message ?? `${data?.length} filas`,
    )
  }

  console.log('\nModificación (B no puede cambiar ni borrar datos de A):')
  for (const [table, id, patch] of [
    ['profiles', a.id, { display_name: 'hackeado' }],
    ['exercises', ids.exercise, { name: 'hackeado' }],
    ['workout_templates', ids.template, { name: 'hackeado' }],
    ['workout_sessions', ids.session, { name: 'hackeado' }],
    ['exercise_sets', ids.set, { weight_kg: 999 }],
  ]) {
    const upd = await b.c.from(table).update(patch).eq('id', id).select('id')
    check(`${table}: update sin efecto`, !upd.error && upd.data.length === 0, upd.error?.message)
  }
  for (const [table, id] of [
    ['workout_templates', ids.template],
    ['workout_sessions', ids.session],
    ['exercise_sets', ids.set],
  ]) {
    const del = await b.c.from(table).delete().eq('id', id).select('id')
    check(`${table}: delete sin efecto`, !del.error && del.data.length === 0, del.error?.message)
  }
  const stillThere = await a.c.from('exercise_sets').select('weight_kg').eq('id', ids.set).single()
  check('la serie de A sigue intacta', Number(stillThere.data?.weight_kg) === 60)

  console.log('\nInserción (B no puede escribir a nombre de A ni colgarse de sus datos):')
  let r = await b.c.from('workout_templates').insert({ user_id: a.id, name: tag })
  check('rutina con user_id de A: rechazada', Boolean(r.error))
  r = await b.c
    .from('template_exercises')
    .insert({ user_id: b.id, template_id: ids.template, exercise_id: globalEx.id })
  check('ejercicio en la rutina de A: rechazado', Boolean(r.error))
  must(
    await b.c.from('workout_sessions').insert({ id: ids.sessionB, user_id: b.id, name: tag }),
    'sesión B',
  )
  r = await b.c.from('session_exercises').insert({
    user_id: b.id,
    session_id: ids.sessionB,
    exercise_id: ids.exercise,
    exercise_name_snapshot: tag,
  })
  check('usar el ejercicio personalizado de A: rechazado', Boolean(r.error))
  r = await b.c
    .from('exercise_sets')
    .insert({ user_id: b.id, session_exercise_id: ids.sessionExercise, set_number: 2 })
  check('serie en la sesión de A: rechazada', Boolean(r.error))

  console.log('\nEjercicios globales y permisos especiales:')
  r = await b.c.from('exercises').update({ name: 'hackeado' }).eq('id', globalEx.id).select('id')
  check(
    'modificar un ejercicio global: sin efecto',
    !r.error && r.data.length === 0,
    r.error?.message,
  )
  r = await b.c.from('exercises').insert({ owner_user_id: null, name: tag })
  check('crear un ejercicio global: rechazado', Boolean(r.error))
  r = await b.c.from('profiles').update({ plan: 'pro' }).eq('id', b.id)
  check('cambiar el propio plan: rechazado', Boolean(r.error))
  const anon = await client().from('exercises').select('id').limit(1)
  check('anónimo no lee ejercicios', Boolean(anon.error) || anon.data.length === 0)
} finally {
  console.log('\nLimpiando…')
  await a.c.from('workout_sessions').delete().eq('id', ids.session)
  await a.c.from('workout_templates').delete().eq('id', ids.template)
  await a.c.from('exercise_user_notes').delete().eq('id', ids.note)
  await a.c.from('exercises').delete().eq('id', ids.exercise)
  await b.c.from('workout_sessions').delete().eq('id', ids.sessionB)
}

console.log(
  failures === 0
    ? '\nRLS OK: todas las verificaciones pasaron.'
    : `\n${failures} verificaciones fallaron.`,
)
process.exit(failures === 0 ? 0 : 1)
