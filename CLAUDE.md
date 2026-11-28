# ASCEND — Contexto del proyecto para Claude Code

> BUILD YOURSELF. TRACK YOUR PROGRESS.

Este archivo es el contexto permanente del proyecto. Leelo completo antes de cada tarea.

## Qué es ASCEND

App web (PWA) de seguimiento de entrenamiento de fuerza y progreso físico. La usa todos los días en el gimnasio desde su iPhone el dueño del proyecto (Julius). La arquitectura es multiusuario desde el día 1 porque más adelante puede convertirse en producto.

Principios: simplicidad, consistencia, datos reales, progreso visible. Nada de pantallas sobrecargadas ni funciones a medias.

## Etapa actual: modo local (decisión del 25/11/2026)

Por ahora ASCEND es de **un solo usuario y sin login**: si no hay variables de Supabase, la app arranca en *modo local* (`isLocalMode` en `src/lib/env.ts`) y guarda todo en el dispositivo (Dexie). El login, el esquema SQL y RLS ya están hechos y se activan cuando Julian diga "siguiente nivel": se configura Supabase y los datos locales se suben con sus mismos UUID.

Mientras tanto: toda funcionalidad se construye local-first (Dexie como fuente de verdad), con UUID de cliente y `user_id` en cada registro, para que la sincronización se sume después sin rehacer nada. La exportación JSON es la red de seguridad de los datos.

## Restricciones que mandan sobre todo lo demás

1. **Gratis.** Hosting en **GitHub Pages** (estático) + **Supabase Free**. Sin servidores propios ni servicios pagos.
2. **Sitio 100% estático (SPA).** No hay backend propio: el frontend habla directo con Supabase usando la *anon key*, y la seguridad la garantiza **Row Level Security**. Nada de SSR, API routes ni server actions.
3. **iPhone primero.** Se instala desde Safari → Compartir → "Agregar a inicio". Todo debe funcionar bien en Safari iOS.
4. **El entrenamiento activo funciona sin conexión.** En el gimnasio la señal es mala. Registrar una serie nunca puede depender de la red.

## Stack

| Área | Tecnología |
|---|---|
| Build | Vite + React + TypeScript (`strict: true`) |
| Estilos | Tailwind CSS + componentes estilo shadcn/ui (Radix) + Lucide icons |
| Routing | React Router con **HashRouter** (GitHub Pages no soporta rutas del lado del servidor) |
| Datos remotos | `@supabase/supabase-js` + TanStack Query |
| Offline | Dexie (IndexedDB) para la sesión activa y la cola de sincronización |
| Formularios | React Hook Form + Zod |
| Gráficos | Recharts (fases posteriores) |
| Animación | CSS; `motion` (Framer Motion) solo si se justifica |
| PWA | `vite-plugin-pwa` (service worker + manifest) |
| Tests | Vitest + Testing Library |
| Deploy | GitHub Actions → GitHub Pages |
| DB | Supabase CLI con migraciones SQL versionadas en `supabase/migrations/` |

Usá versiones estables actuales. No instales paquetes fuera de esta lista sin explicar por qué y pedir confirmación.

## Arquitectura de carpetas

```
src/
  app/            # providers, router, layout (bottom nav móvil / sidebar desktop)
  features/
    auth/
    exercises/
    templates/    # rutinas
    workout/      # entrenamiento activo
    history/
    profile/
  components/ui/  # componentes base reutilizables
  lib/
    supabase.ts   # cliente único
    db/           # Dexie: esquema local + cola de sync
    sync/         # motor de sincronización
  services/       # acceso a datos por dominio (sin JSX)
  domain/         # lógica pura: volumen, e1RM, récords, comparaciones (testeada)
  schemas/        # Zod
  types/          # tipos, incluido database.types.ts generado por Supabase
  i18n/           # textos centralizados: es.ts (por defecto) y en.ts
supabase/
  migrations/
  seed.sql
```

Reglas:
- Los componentes no llaman a Supabase directamente: usan hooks → services.
- La lógica de cálculo vive en `src/domain/` como funciones puras con tests.
- Textos visibles en `src/i18n/es.ts` (por defecto) y `src/i18n/en.ts` (misma forma, `Messages`), no hardcodeados en componentes. El idioma se cambia en Perfil. Los nombres de ejercicios y rutinas se traducen al mostrar con `src/i18n/names.ts` (en la base quedan en inglés).
- Tipos de DB generados con `supabase gen types typescript`.

## Offline y sincronización (crítico)

- Todo registro se crea con **UUID generado en el cliente** (`crypto.randomUUID()`), así los reintentos son idempotentes (`upsert`).
- La sesión activa se escribe **primero en Dexie** y se encola para subir a Supabase. La UI lee de Dexie mientras la sesión está en curso.
- La cola se procesa al recuperar conexión, al volver la app al frente (`visibilitychange`) y periódicamente. Reintentos con backoff.
- Al abrir la app, si hay una sesión `in_progress` local, se ofrece **retomarla**.
- Indicador discreto de estado: "Guardado en el dispositivo" / "Sincronizado".
- Antes de cerrar sesión de usuario, avisar si hay datos sin sincronizar.

## Particularidades de iOS Safari a respetar

- `viewport-fit=cover` y `env(safe-area-inset-*)` para la barra inferior y el notch.
- Inputs con `font-size` ≥ 16px (si no, iOS hace zoom). Peso: `inputMode="decimal"`; reps/RIR: `inputMode="numeric"`.
- Aceptar coma y punto como separador decimal (69,5 y 69.5).
- `apple-touch-icon`, `apple-mobile-web-app-capable`, `theme-color` #0E0B16.
- **Temporizador de descanso:** iOS congela el JS cuando la app pasa a segundo plano. Guardá la hora de fin (timestamp) y calculá el tiempo restante; no confíes en `setInterval`. La Vibration API no existe en iOS: feedback visual (y sonido opcional).
- Zonas táctiles de 44px como mínimo.

## Diseño — Dark minimal premium

**La referencia visual principal es `design/referencia.*`.** Si la paleta de abajo choca con la imagen, gana la imagen. Los tokens finales viven en el archivo de tema; actualizá esta sección cuando cambien. El objetivo es que la app se vea premium y "fachera", con animaciones fluidas y que respeten `prefers-reduced-motion`.

Paleta **Olimpo** (elegida el 28/11/2026; tokens en `src/index.css`):
- bg `#0E0B16` · bg-2 `#13101D` · card `#181325` · card-2 `#221B33` · border `#2E2642`
- text `#F5F3FA` · text-muted `#A39DB5`
- accent (violeta real) `#7C3AED` · accent-2 `#A78BFA`
- `gold` `#FACC15` para rellenos (días hechos, logros, campamentos, anillos) con `gold-fg` `#1A1300`; `success` es el oro para textos
- Violeta = esfuerzo (botones, XP, series). Oro = lo que se gana (logros, récords, Olimpo).
- Ícono de la app: el pico en blanco y el chevron dorado sobre `#0E0B16` (`npm run icons`).

Hay **modo claro** (Ajustes → Apariencia: automático / oscuro / claro): mismos tokens con otra paleta en `:root[data-theme='light']` de `src/index.css`; el oro de los textos se oscurece (`#A16207`) para leerse sobre blanco. El oscuro sigue siendo la identidad de la marca.

Tipografía moderna (Inter o Geist), números tabulares en los datos. Esquinas suaves, espaciado generoso, animaciones cortas y funcionales. Evitar: gradientes por todos lados, colores saturados, cards innecesarias, emojis como íconos, aspecto de plantilla genérica.

Navegación: barra inferior en móvil (Home, Workouts, Progress, Nutrition, Profile); sidebar compacta en desktop. Las secciones que todavía no existen **no se muestran** (o aparecen deshabilitadas con la etiqueta "Próximamente"). Nunca botones decorativos que parezcan funcionales.

## Seguridad

- Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` (en `.gitignore`) y como secrets de GitHub Actions. La anon key es pública por diseño; **la `service_role` key nunca va al frontend ni al repo.**
- RLS activado en **todas** las tablas. Cada usuario solo lee y escribe sus filas (`auth.uid()`).
- Ejercicios globales (`owner_user_id IS NULL`): todos los leen, nadie los modifica desde la app (solo vía migraciones/seed).
- Validación con Zod en el cliente **y** constraints/CHECKs en la base.
- Las fotos de progreso (fase futura) van a un bucket **privado**, con políticas por usuario y URLs firmadas.

## Datos

- Unidades base: kg y cm. Idioma de la app: español por defecto, inglés opcional desde Perfil.
- Volumen = peso × reps, solo para series completadas de ejercicios con carga.
- e1RM con fórmula de Epley (`peso × (1 + reps/30)`), indicando que es una estimación.
- Nunca datos inventados en la app. Los datos de demo solo en un modo preview claramente identificado.
- Los valores nutricionales iniciales (2800 kcal / 140 P / 390 C / 70 G) son configurables y provisionales; no se presentan como recomendación médica.

## Forma de trabajo

- Trabajar por fases. **No avanzar** si la fase actual tiene errores críticos.
- Al cerrar cada fase: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, y resumen de qué se construyó, cómo probarlo y qué falta.
- Commits pequeños y descriptivos (Conventional Commits). No hacer push sin que el usuario lo pida.
- Nunca correr migraciones destructivas (`DROP`, `TRUNCATE`, `supabase db reset` contra el proyecto remoto) sin confirmación explícita.
- No simular funciones que no están implementadas.
- Si falta una variable de entorno o una configuración, explicar exactamente qué hay que hacer y dónde.
- Mantenible antes que rápido.

## Fuera del MVP (no construir todavía)

AI Coach, pagos/suscripciones/planes, comunidad, panel de administración, contador de alimentos, agua, escaneo de códigos. La arquitectura los contempla (por ejemplo, un campo `plan` en `profiles` y servicios separados), pero no se implementan.
