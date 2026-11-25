-- =============================================================================
-- ASCEND — 0001_init
-- Esquema base: perfiles, ejercicios, rutinas y entrenamientos.
-- Reglas:
--   * Todas las tablas con id uuid (generado en el cliente cuando aplica), created_at y
--     updated_at (trigger).
--   * Las tablas hijas llevan user_id desnormalizado; un trigger garantiza que coincide con
--     el del padre.
--   * RLS en todas las tablas: cada usuario solo ve y modifica sus filas.
--   * deleted_at permite borrados lógicos que viajan por la cola de sincronización offline.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funciones auxiliares
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Verifica que la fila padre (tg_argv[0] = tabla, tg_argv[1] = columna FK) pertenezca al mismo
-- usuario que la fila hija. Corre con los permisos del usuario: si el padre es de otro usuario,
-- RLS lo oculta y la verificación falla.
create or replace function public.assert_parent_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_id uuid;
  parent_user_id uuid;
begin
  execute format('select ($1).%I', tg_argv[1]) using new into parent_id;
  execute format('select user_id from public.%I where id = $1', tg_argv[0])
    using parent_id into parent_user_id;

  if parent_user_id is distinct from new.user_id then
    raise exception 'user_id no coincide con el de %', tg_argv[0]
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Verifica que el ejercicio referenciado sea global o del mismo usuario.
create or replace function public.assert_exercise_visible()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.exercise_id is not null and not exists (
    select 1 from public.exercises e
    where e.id = new.exercise_id
      and (e.owner_user_id is null or e.owner_user_id = new.user_id)
  ) then
    raise exception 'ejercicio % no disponible para este usuario', new.exercise_id
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text check (char_length(display_name) between 1 and 60),
  age                smallint check (age between 10 and 120),
  height_cm          numeric(5, 1) check (height_cm between 50 and 300),
  initial_weight_kg  numeric(5, 2) check (initial_weight_kg between 20 and 500),
  weight_unit        text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  length_unit        text not null default 'cm' check (length_unit in ('cm', 'in')),
  goal               text check (char_length(goal) <= 280),
  start_date         date not null default current_date,
  locale             text not null default 'es' check (char_length(locale) between 2 and 10),
  -- Preparado para planes futuros. El usuario NO puede modificarlo (ver grants abajo).
  plan               text not null default 'free' check (plan in ('free', 'pro')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil al registrarse. Toma el nombre de los metadatos del signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 60), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- exercises
-- owner_user_id null = ejercicio global (solo lectura, se carga por migración).
-- primary_muscle y equipment usan claves estables; los nombres visibles están en i18n.
-- -----------------------------------------------------------------------------

create table public.exercises (
  id                 uuid primary key default gen_random_uuid(),
  owner_user_id      uuid references auth.users (id) on delete cascade,
  name               text not null check (char_length(btrim(name)) between 1 and 80),
  primary_muscle     text check (primary_muscle in (
                       'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
                       'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'full_body', 'other')),
  secondary_muscles  text[] not null default '{}',
  equipment          text check (equipment in (
                       'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight',
                       'kettlebell', 'band', 'smith', 'other')),
  exercise_type      text not null default 'weighted'
                       check (exercise_type in ('weighted', 'bodyweight', 'timed')),
  instructions       text check (char_length(instructions) <= 4000),
  image_url          text check (char_length(image_url) <= 2048),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

-- Un unique común no sirve para los globales: en Postgres dos NULL son distintos.
create unique index exercises_global_name_key
  on public.exercises (lower(name))
  where owner_user_id is null and deleted_at is null;

create unique index exercises_owner_name_key
  on public.exercises (owner_user_id, lower(name))
  where owner_user_id is not null and deleted_at is null;

create trigger exercises_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- exercise_user_notes
-- Nota fija de cada usuario por ejercicio (ej.: "asiento en 4"). Tabla aparte porque los
-- ejercicios globales no se pueden modificar.
-- -----------------------------------------------------------------------------

create table public.exercise_user_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  notes        text not null check (char_length(notes) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create index exercise_user_notes_exercise_id_idx on public.exercise_user_notes (exercise_id);

create trigger exercise_user_notes_updated_at before update on public.exercise_user_notes
  for each row execute function public.set_updated_at();
create trigger exercise_user_notes_exercise_visible before insert or update on public.exercise_user_notes
  for each row execute function public.assert_exercise_visible();

-- -----------------------------------------------------------------------------
-- workout_templates (rutinas)
-- -----------------------------------------------------------------------------

create table public.workout_templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 80),
  description  text check (char_length(description) <= 500),
  -- 0 = domingo … 6 = sábado (igual que Date.getDay())
  weekdays     smallint[] not null default '{}'
                 check (weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  notes        text check (char_length(notes) <= 2000),
  position     integer not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index workout_templates_user_id_idx on public.workout_templates (user_id, position);

create trigger workout_templates_updated_at before update on public.workout_templates
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- template_exercises
-- -----------------------------------------------------------------------------

create table public.template_exercises (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id          uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id          uuid not null references public.exercises (id),
  position             integer not null default 0,
  target_sets          smallint check (target_sets between 1 and 20),
  target_reps_min      smallint check (target_reps_min between 1 and 100),
  target_reps_max      smallint check (target_reps_max between 1 and 100),
  target_rest_seconds  integer check (target_rest_seconds between 0 and 1800),
  target_rir           smallint check (target_rir between 0 and 10),
  notes                text check (char_length(notes) <= 1000),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  check (target_reps_min is null or target_reps_max is null or target_reps_min <= target_reps_max)
);

create index template_exercises_template_id_idx on public.template_exercises (template_id, position);
create index template_exercises_exercise_id_idx on public.template_exercises (exercise_id);
create index template_exercises_user_id_idx on public.template_exercises (user_id);

create trigger template_exercises_updated_at before update on public.template_exercises
  for each row execute function public.set_updated_at();
create trigger template_exercises_parent_owner before insert or update on public.template_exercises
  for each row execute function public.assert_parent_owner('workout_templates', 'template_id');
create trigger template_exercises_exercise_visible before insert or update on public.template_exercises
  for each row execute function public.assert_exercise_visible();

-- -----------------------------------------------------------------------------
-- workout_sessions
-- -----------------------------------------------------------------------------

create table public.workout_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id       uuid references public.workout_templates (id) on delete set null,
  name              text not null check (char_length(btrim(name)) between 1 and 80),
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  duration_seconds  integer check (duration_seconds between 0 and 86400),
  status            text not null default 'in_progress'
                      check (status in ('in_progress', 'completed', 'discarded')),
  notes             text check (char_length(notes) <= 2000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  check (status <> 'completed' or completed_at is not null),
  check (completed_at is null or completed_at >= started_at)
);

create index workout_sessions_user_started_idx on public.workout_sessions (user_id, started_at desc);
create index workout_sessions_template_id_idx on public.workout_sessions (template_id);

create trigger workout_sessions_updated_at before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- session_exercises
-- -----------------------------------------------------------------------------

create table public.session_exercises (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id              uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id             uuid references public.exercises (id) on delete set null,
  exercise_name_snapshot  text not null check (char_length(btrim(exercise_name_snapshot)) between 1 and 80),
  position                integer not null default 0,
  notes                   text check (char_length(notes) <= 1000),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

create index session_exercises_session_id_idx on public.session_exercises (session_id, position);
create index session_exercises_user_exercise_idx on public.session_exercises (user_id, exercise_id);
create index session_exercises_exercise_id_idx on public.session_exercises (exercise_id);

create trigger session_exercises_updated_at before update on public.session_exercises
  for each row execute function public.set_updated_at();
create trigger session_exercises_parent_owner before insert or update on public.session_exercises
  for each row execute function public.assert_parent_owner('workout_sessions', 'session_id');
create trigger session_exercises_exercise_visible before insert or update on public.session_exercises
  for each row execute function public.assert_exercise_visible();

-- -----------------------------------------------------------------------------
-- exercise_sets
-- -----------------------------------------------------------------------------

create table public.exercise_sets (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_exercise_id  uuid not null references public.session_exercises (id) on delete cascade,
  set_number           smallint not null check (set_number between 1 and 50),
  -- Las series de calentamiento no suman volumen ni cuentan como récord.
  set_type             text not null default 'normal' check (set_type in ('warmup', 'normal')),
  weight_kg            numeric(6, 2) check (weight_kg >= 0 and weight_kg < 10000),
  repetitions          smallint check (repetitions between 0 and 1000),
  -- Para ejercicios por tiempo (ej.: plancha).
  duration_seconds     integer check (duration_seconds between 0 and 86400),
  rir                  smallint check (rir between 0 and 10),
  is_completed         boolean not null default false,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create index exercise_sets_session_exercise_id_idx on public.exercise_sets (session_exercise_id, set_number);
create index exercise_sets_user_id_idx on public.exercise_sets (user_id);

create trigger exercise_sets_updated_at before update on public.exercise_sets
  for each row execute function public.set_updated_at();
create trigger exercise_sets_parent_owner before insert or update on public.exercise_sets
  for each row execute function public.assert_parent_owner('session_exercises', 'session_exercise_id');

-- -----------------------------------------------------------------------------
-- Row Level Security
-- (select auth.uid()) en vez de auth.uid(): Postgres lo evalúa una vez por consulta.
-- -----------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.exercises           enable row level security;
alter table public.exercise_user_notes enable row level security;
alter table public.workout_templates   enable row level security;
alter table public.template_exercises  enable row level security;
alter table public.workout_sessions    enable row level security;
alter table public.session_exercises   enable row level security;
alter table public.exercise_sets       enable row level security;

-- profiles: leer y editar el propio. Se crea por trigger y se borra en cascada con la cuenta.
create policy "profiles: select own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- exercises: los globales los lee cualquiera autenticado; solo se escriben los propios.
create policy "exercises: select global or own" on public.exercises
  for select to authenticated
  using (owner_user_id is null or owner_user_id = (select auth.uid()));
create policy "exercises: insert own" on public.exercises
  for insert to authenticated with check (owner_user_id = (select auth.uid()));
create policy "exercises: update own" on public.exercises
  for update to authenticated
  using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));
create policy "exercises: delete own" on public.exercises
  for delete to authenticated using (owner_user_id = (select auth.uid()));

-- Tablas con user_id: CRUD solo de las filas propias.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'exercise_user_notes', 'workout_templates', 'template_exercises',
    'workout_sessions', 'session_exercises', 'exercise_sets'
  ] loop
    execute format(
      'create policy "%1$s: select own" on public.%1$I for select to authenticated
         using (user_id = (select auth.uid()))', tbl);
    execute format(
      'create policy "%1$s: insert own" on public.%1$I for insert to authenticated
         with check (user_id = (select auth.uid()))', tbl);
    execute format(
      'create policy "%1$s: update own" on public.%1$I for update to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', tbl);
    execute format(
      'create policy "%1$s: delete own" on public.%1$I for delete to authenticated
         using (user_id = (select auth.uid()))', tbl);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Permisos
-- El rol anon no accede a ninguna tabla. En profiles, el usuario no puede cambiar su plan ni
-- sus fechas de sistema.
-- -----------------------------------------------------------------------------

revoke all on table
  public.profiles, public.exercises, public.exercise_user_notes, public.workout_templates,
  public.template_exercises, public.workout_sessions, public.session_exercises,
  public.exercise_sets
from anon;

revoke insert, update, delete on table public.profiles from authenticated;
grant update (display_name, age, height_cm, initial_weight_kg, weight_unit, length_unit, goal,
              start_date, locale)
  on table public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- keep_alive: consulta liviana para el workflow que evita la pausa de Supabase Free.
-- -----------------------------------------------------------------------------

create or replace function public.keep_alive()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select now();
$$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
