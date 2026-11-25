# ASCEND — Prompt inicial para Claude Code

> Pegá este texto en Claude Code (VS Code) con la carpeta `ascend` abierta. En la raíz tiene que haber:
> - `CLAUDE.md`
> - `ejercicios-base.csv`
> - `design/referencia.png`, con la imagen de referencia del estilo (puede ser .jpg)

---

Vamos a construir **ASCEND**. Leé primero `CLAUDE.md`: ahí están el producto, el stack, la arquitectura, el diseño y las reglas de trabajo. Ese archivo manda sobre cualquier suposición tuya.

Actuá como un equipo senior: arquitecto, desarrollador full-stack, diseñador UI/UX, ingeniero de base de datos y QA. Quiero una app real con base de datos, login y persistencia. No quiero una maqueta.

## Objetivo de esta primera entrega

Una app instalable en mi iPhone que pueda usar en el gimnasio dentro de 1 o 2 semanas para:
1. Iniciar sesión.
2. Elegir ejercicios de una biblioteca o crear los míos.
3. Armar rutinas (por ejemplo Upper A / Lower A / Upper B / Lower B) y asignarlas a días.
4. Hacer un entrenamiento: registrar peso, reps y RIR de cada serie en segundos, **aunque no haya señal**.
5. Ver qué hice la última vez en cada ejercicio, el historial y mis récords.

Progreso corporal, fotos, nutrición y estadísticas quedan para entregas posteriores (al final de este documento).

## Referencia visual

En `design/` hay una imagen con los colores, el estilo y la forma que me gustan. **Abrila y analizala antes de diseñar.** Es la referencia principal del look de la app:
- Sacá de ahí la paleta, el estilo de las cards, los radios de las esquinas, la tipografía, la densidad, cómo muestra los números y los gráficos, y el tipo de íconos.
- Si choca con la paleta de `CLAUDE.md`, gana la imagen: ajustá los tokens y avisame qué cambiaste.
- No la copies píxel por píxel. Tomá el lenguaje visual y aplicalo a las pantallas de ASCEND.

**Nivel de calidad: tiene que verse fachera.** Que dé ganas de abrirla todos los días y que parezca una app premium, no una plantilla. Concretamente:
- Transiciones suaves entre pantallas y microinteracciones al tocar botones, marcar series y terminar el entrenamiento.
- Números que se animan al cambiar (volumen, contadores, temporizador).
- Una celebración sobria al batir un récord personal o al terminar un entrenamiento.
- Skeletons en lugar de spinners y estados vacíos con diseño propio.
- Todo fluido en el iPhone: animá solo `transform` y `opacity`. Si una animación traba, se saca.
- Respetá `prefers-reduced-motion`.

Para las animaciones podés usar `motion` (Framer Motion) si lo justificás. Si no, CSS.

## Animación de inicio

- Splash corto al abrir la app en frío: el logo/wordmark ASCEND con un movimiento ascendente sutil y un acento violeta. Duración máxima ~1,2 s.
- No bloquea: si la app ya está lista, se puede saltear tocando. No se repite al navegar dentro de la app.
- Una pantalla de inicio estática de iOS (`apple-touch-startup-image` o, como mínimo, un fondo #09090B) para que no haya flash blanco antes de que cargue el JS.
- Diseñá un logo simple en SVG (por ejemplo, una "A" o un chevron ascendente) que sirva para el splash, los íconos de la PWA y el header.

## Antes de escribir código

1. Inspeccioná la carpeta y el entorno (versiones de Node, npm, git, Supabase CLI).
2. Analizá la imagen de referencia.
3. Presentame en un mensaje corto:
   - la arquitectura, el modelo de datos final y la estructura de carpetas;
   - los riesgos técnicos que veas;
   - la dirección visual que sacaste de la imagen (paleta final, tipografía, estilo);
   - **tus propuestas de mejora**: de 5 a 8 ideas concretas de funciones o cambios que harían a ASCEND mejor o más cómoda en el gimnasio, cada una con una línea de por qué y su costo (bajo, medio o alto). Marcá cuáles meterías ya en el MVP y cuáles dejarías para después. Sé crítico con este plan: si algo te parece mal planteado, decilo.
4. Esperá mi OK y arrancá con la Fase 1.

---

## FASE 1 — Fundación

- Proyecto Vite + React + TS estricto, con Tailwind, alias `@/`, ESLint, Prettier y Vitest.
- `vite.config.ts` con `base: '/ascend/'` (nombre del repo en GitHub Pages) configurable por variable.
- Sistema visual basado en la imagen de referencia, logo SVG, splash de inicio y transiciones. Tokens de la paleta, tipografía, componentes base (Button, Input numérico, Card, Sheet/Drawer, Dialog de confirmación, Toast, EmptyState, Skeleton).
- Layout: bottom nav móvil con safe areas y sidebar en desktop. Solo se muestran las secciones que existen.
- PWA: manifest (nombre ASCEND, `display: standalone`, colores oscuros), íconos (incluido apple-touch-icon 180×180; generalos como SVG/PNG simples con la marca, sin depender de servicios externos), service worker que cachea el app shell.
- Supabase: cliente único, `.env.example`, sesión persistente.
- Auth: registro, login, logout, recuperación de contraseña (con redirect a la URL de GitHub Pages) y rutas protegidas.
- Migración `0001_init.sql` con el esquema de abajo, RLS e índices. `seed.sql` con la biblioteca inicial de ejercicios.
- Workflow `.github/workflows/deploy.yml`: en cada push a `main` → install, typecheck, test, build y deploy a GitHub Pages, leyendo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de los secrets del repo.
- `README.md` con la configuración paso a paso (ver "Checklist de configuración" más abajo).

**Criterio de cierre:** puedo crear una cuenta, entrar, salir, ver la navegación vacía con estados vacíos prolijos, y la app se instala en el iPhone desde GitHub Pages.

## FASE 2 — Sistema de entrenamiento

### 2.1 Biblioteca de ejercicios
Empezamos simple y la vamos enriqueciendo de a poco.
- **Base global:** `ejercicios-base.csv` (unos 80 ejercicios comunes, con nombre, grupo y equipamiento). Convertilo en `supabase/seed.sql`. Por ahora **solo esos tres datos**: sin instrucciones ni músculos secundarios (las columnas existen en la tabla, pero quedan vacías).
- **Mis ejercicios:** crear, editar y borrar los propios con un formulario rápido (nombre obligatorio, grupo y equipamiento opcionales). Que se puedan crear también **al vuelo** desde el constructor de rutinas o desde el entrenamiento activo, sin salir de la pantalla. Los globales son de solo lectura.
- **Imágenes: todavía no.** Cada ejercicio muestra un ícono: una pesa (Lucide `Dumbbell`) o un ícono por equipamiento, dentro de un contenedor con un tinte de color según el grupo muscular. Dejá el componente `ExerciseThumbnail` preparado para usar una imagen cuando `image_url` exista.
- **Interfaz:** búsqueda instantánea sin distinguir tildes ni mayúsculas, chips de filtro por grupo y equipamiento, una sección "Recientes" o "Más usados" arriba, y una etiqueta "Personalizado" en los ejercicios propios. Que buscar y elegir un ejercicio se sienta rápido y lindo.

### 2.2 Rutinas
- Crear y editar: nombre, descripción, día(s) de la semana (opcional), notas.
- Agregar, quitar y reordenar ejercicios (botones arriba/abajo; arrastrar es opcional, pero tiene que andar en táctil).
- Por ejercicio: series, rango de reps, descanso, RIR objetivo y notas.
- Duplicar rutina. Vista de semana con las rutinas asignadas a cada día, sin estructura fija impuesta.

### 2.3 Entrenamiento activo (la pantalla más importante)
- Se inicia desde una rutina o vacío. Si ya hay uno en curso, se ofrece retomarlo.
- Un ejercicio por pantalla, con navegación anterior/siguiente y un listado para saltar a cualquier ejercicio.
- Fila por serie: peso | reps | RIR | ✓. Precargada con el objetivo y con **lo que hice la última vez** en esa serie ("Última: 45 kg × 8").
- Al marcar ✓: se guarda en el dispositivo, arranca el temporizador de descanso (opcional, con el tiempo de la rutina) y el foco pasa a la siguiente serie.
- Agregar o quitar series, editar cualquier serie, notas por ejercicio, agregar un ejercicio extra o reemplazar uno.
- Todo en una sola pantalla, sin modales para registrar una serie. Botones grandes y pensados para usar con una mano.
- Guardado automático local + cola de sync (ver `CLAUDE.md`).
- Al terminar: resumen con duración, ejercicios, series completadas, volumen total, récords nuevos y comparación con la sesión anterior de la misma rutina.
- Descartar un entrenamiento pide confirmación.

### 2.4 Historial
- Lista de sesiones por fecha, con su detalle.
- Historial por ejercicio: todas las series, mejor serie, e1RM estimado, máximo peso y máximas reps a cada peso.
- Récords personales por ejercicio.

### 2.5 Home (versión mínima)
- Saludo, fecha, entrenamientos de esta semana, próximo entrenamiento planificado según el día, último entrenamiento y botón "Empezar entrenamiento".
- Sin estadísticas inventadas: si no hay datos, un estado vacío que explique cómo empezar.

### Tests obligatorios en Fase 2
- `domain/`: volumen, e1RM, detección de récords, comparación con la sesión anterior y parseo de decimales con coma.
- Sync: una serie registrada sin conexión llega a Supabase al volver la red, sin duplicados.
- Recuperación: cerrar y reabrir la app con una sesión en curso permite retomarla.
- RLS: un script o test SQL que demuestre que el usuario B no puede leer ni modificar datos del usuario A.

**Criterio de cierre:** hago un entrenamiento completo en modo avión en el iPhone, lo termino, recupero señal y aparece en el historial sin duplicados.

---

## Esquema de base de datos (punto de partida)

Podés mejorarlo si encontrás algo más sólido, pero explicame los cambios. Todas las tablas con `id uuid primary key` (generado en el cliente cuando aplique), `created_at` y `updated_at` (trigger). Las tablas hijas llevan `user_id` desnormalizado para simplificar RLS e índices, con un CHECK o trigger que garantice que coincida con el del padre.

```
profiles            id (= auth.users.id), display_name, age, height_cm, initial_weight_kg,
                    weight_unit ('kg'|'lb'), length_unit ('cm'|'in'), goal, start_date,
                    locale default 'es', plan default 'free'
                    -- se crea con un trigger en el signup

exercises           id, owner_user_id (null = global), name, primary_muscle, secondary_muscles text[],
                    equipment, exercise_type ('weighted'|'bodyweight'|'timed'), instructions, image_url
                    -- unique(owner_user_id, lower(name))

workout_templates   id, user_id, name, description, weekdays smallint[] (0–6), notes, position,
                    archived_at

template_exercises  id, user_id, template_id → workout_templates ON DELETE CASCADE,
                    exercise_id → exercises, position, target_sets, target_reps_min, target_reps_max,
                    target_rest_seconds, target_rir, notes

workout_sessions    id, user_id, template_id (nullable, ON DELETE SET NULL), name, started_at,
                    completed_at, duration_seconds, status ('in_progress'|'completed'|'discarded'), notes

session_exercises   id, user_id, session_id → workout_sessions ON DELETE CASCADE,
                    exercise_id (nullable, ON DELETE SET NULL), exercise_name_snapshot, position, notes

exercise_sets       id, user_id, session_exercise_id → session_exercises ON DELETE CASCADE,
                    set_number, weight_kg numeric(6,2), repetitions, rir, is_completed, completed_at
                    -- CHECKs: weight_kg >= 0, repetitions BETWEEN 0 AND 1000, rir BETWEEN 0 AND 10
```

Índices mínimos: `(user_id, started_at desc)` en sesiones, `(user_id, exercise_id)` en `session_exercises`, y FKs indexadas.

RLS: `select/insert/update/delete` solo donde `user_id = auth.uid()`. En `exercises`, select de `owner_user_id is null or owner_user_id = auth.uid()` y escritura solo de los propios.

Tablas de fases posteriores (crealas recién en su migración): `body_measurements`, `progress_photos`, `nutrition_goals` (con `effective_from`), `nutrition_daily_logs` (`unique(user_id, log_date)`).

---

## Checklist de configuración (incluilo en el README y pedímelo cuando haga falta)

1. **GitHub:** crear el repo `ascend` (público, para que GitHub Pages sea gratis). En Settings → Pages → Source: **GitHub Actions**.
2. **Supabase:** crear un proyecto gratis. Copiar la *Project URL* y la *anon public key* a `.env.local` y a los secrets del repo (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. **Migraciones:** `supabase login` → `supabase link --project-ref <ref>` → `supabase db push`. Cargar el seed.
4. **Auth URLs:** en Supabase → Authentication → URL Configuration, poner como Site URL `https://<usuario>.github.io/ascend/` y agregarla a Redirect URLs (también `http://localhost:5173`).
5. **iPhone:** abrir la URL en Safari → Compartir → **Agregar a inicio**.
6. **Pausa de Supabase Free:** los proyectos gratis se pausan después de 7 días con poca actividad (los datos no se pierden y se reactiva desde el panel). Con uso diario no pasa, pero agregá un workflow programado `keep-alive.yml` que haga una consulta liviana cada 3 días.
7. **Backups:** el plan gratis no tiene backups automáticos. Documentá la exportación manual (`supabase db dump`) y, en una fase posterior, la exportación CSV/JSON desde la app.

---

## Próximas entregas (no implementar ahora)

- **Fase 3 — Progreso corporal:** peso diario con promedio semanal y cambios semanal y mensual; medidas (cintura, pecho, brazos, muslos, cadera, gemelos); gráficos con filtros de 7 días, 30 días, 90 días, 6 meses, 1 año y todo; fotos en un bucket privado con comparación entre dos fechas.
- **Fase 4 — Nutrición:** objetivos editables con historial (`effective_from`), carga manual de los totales diarios, barras de progreso y vista semanal.
- **Fase 5 — Pulido:** estadísticas explicadas (frecuencia, consistencia, volumen, progresión de fuerza), exportación CSV/JSON de todo, accesibilidad, rendimiento y perfil completo con borrado de cuenta.
- **Después del MVP:** AI Coach (analiza, propone y explica, y el usuario aprueba), planes y suscripciones, comunidad.

Empezá ahora con la inspección del entorno y la propuesta de arquitectura. No construyas todo de golpe.
