# ASCEND

> BUILD YOURSELF. TRACK YOUR PROGRESS.

PWA de seguimiento de entrenamiento de fuerza, pensada para usar todos los días en el gimnasio
desde el iPhone. Funciona sin conexión durante el entrenamiento.

**Stack:** Vite + React + TypeScript · Tailwind CSS v4 · Radix · TanStack Query · Dexie ·
Supabase (Auth + Postgres con RLS) · vite-plugin-pwa · Vitest · GitHub Pages.

**Modo local:** sin variables de Supabase, la app funciona para un solo usuario, sin login, con los
datos guardados en el dispositivo. Así se publica hoy. Para pasar a cuentas y nube, seguir el
checklist de abajo (pasos 2 a 4) y cargar los secrets.

El contexto completo del proyecto (producto, arquitectura, reglas) está en [`CLAUDE.md`](CLAUDE.md).

---

## Desarrollo local

Requisitos: Node 22 o superior.

```bash
npm install
cp .env.example .env.local   # opcional: sin esto la app corre en modo local
npm run dev                  # http://localhost:5173
```

| Script                   | Qué hace                                                       |
| ------------------------ | -------------------------------------------------------------- |
| `npm run dev`            | Servidor de desarrollo                                         |
| `npm run build`          | Typecheck + build de producción en `dist/`                     |
| `npm run preview`        | Sirve el build (para probar la PWA)                            |
| `npm run typecheck`      | TypeScript estricto                                            |
| `npm run lint`           | ESLint                                                         |
| `npm test`               | Tests (Vitest)                                                 |
| `npm run format`         | Prettier                                                       |
| `npm run icons`          | Regenera íconos, favicon y pantallas de inicio de iOS          |
| `npm run seed:exercises` | Regenera la migración de ejercicios globales desde el CSV      |
| `npm run db:types`       | Regenera `src/types/database.types.ts` desde el proyecto remoto |
| `npm run test:rls`       | Prueba de Row Level Security contra Supabase (ver abajo)       |

La Supabase CLI viene como dependencia de desarrollo: se usa con `npx supabase …` (no hace falta
instalarla en el sistema).

---

## Checklist de configuración

### 1. GitHub

1. Crear el repo **`ascend`**, público (GitHub Pages es gratis en repos públicos).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Subir el código:
   ```bash
   git remote add origin https://github.com/<usuario>/ascend.git
   git push -u origin main
   ```

Si el repo se llama distinto, no hay que tocar nada: el workflow usa el nombre del repo como ruta
base (`/<repo>/`).

### 2. Supabase

1. Crear un proyecto gratis en [supabase.com](https://supabase.com) (región cercana, por ejemplo
   São Paulo). Guardar la contraseña de la base: se pide en el paso 3.
2. En **Project Settings → API** copiar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. Pegarlas en `.env.local` (local) y en **GitHub → Settings → Secrets and variables → Actions →
   New repository secret** (mismos nombres).

> La anon key es pública por diseño: la seguridad la da Row Level Security.
> **La `service_role` key nunca va en el frontend, en `.env.local` ni en el repo.**

### 3. Migraciones

```bash
npx supabase login
npx supabase link --project-ref <ref>   # el ref está en la URL del proyecto
npx supabase db push                    # aplica supabase/migrations/
npm run db:types                        # opcional: regenera los tipos desde la base real
```

`db push` crea las tablas, las políticas RLS y carga la biblioteca de 81 ejercicios globales (está
en `0002_global_exercises.sql`, no en `seed.sql`, porque el seed no se aplica en remoto).

### 4. Auth

En **Authentication → URL Configuration**:

- **Site URL:** `https://<usuario>.github.io/ascend/`
- **Redirect URLs:** agregar `https://<usuario>.github.io/ascend/` y `http://localhost:5173/`

En **Authentication → Sign In / Providers → Email**:

- **Confirm email:** recomendado **desactivarlo** mientras seas el único usuario. El servidor de mail
  incluido en Supabase Free manda muy pocos mails por hora. Si lo dejás activo, conviene configurar
  un SMTP propio (Authentication → Emails → SMTP Settings).

En **Authentication → Emails → Reset Password**, agregar el código al template para poder recuperar
la contraseña desde la app instalada (en iOS el link del mail se abre en Safari, no en la PWA):

```html
<h2>Recuperar contraseña</h2>
<p>Tu código: <strong>{{ .Token }}</strong></p>
<p>O tocá este link desde el mismo navegador donde lo pediste:</p>
<p><a href="{{ .ConfirmationURL }}">Crear contraseña nueva</a></p>
```

### 5. iPhone

1. Abrir `https://<usuario>.github.io/ascend/` en **Safari**.
2. **Compartir → Agregar a inicio.**
3. Abrir ASCEND desde el ícono e iniciar sesión. La app instalada no comparte la sesión con Safari:
   hay que entrar una vez dentro de la app.

### 6. Pausa de Supabase Free

Los proyectos gratis se pausan después de 7 días con poca actividad. Los datos no se pierden y se
reactiva desde el panel. El workflow [`keep-alive.yml`](.github/workflows/keep-alive.yml) hace una
consulta liviana cada 3 días (usa los mismos secrets). Se puede correr a mano desde la pestaña
**Actions**.

> GitHub desactiva los workflows programados en repos sin actividad durante 60 días. Si pasa, se
> reactiva desde Actions.

### 7. Backups

El plan gratis no incluye backups automáticos. Exportación manual:

```bash
npx supabase db dump --data-only -f backup-$(date +%F).sql
```

La exportación CSV/JSON desde la app llega en una fase posterior.

---

## Prueba de RLS

Además de la política en la base, hay un script que demuestra que un usuario no puede leer ni
modificar los datos de otro.

1. Crear dos usuarios de prueba desde la app.
2. Agregar a `.env.local`:
   ```
   RLS_USER_A_EMAIL=...
   RLS_USER_A_PASSWORD=...
   RLS_USER_B_EMAIL=...
   RLS_USER_B_PASSWORD=...
   ```
3. `npm run test:rls`. Crea datos con A, intenta leerlos, modificarlos, borrarlos y colgarse de ellos
   con B, y limpia todo al terminar.

---

## Estructura

```
src/
  app/          providers, router, layout (bottom nav / sidebar), splash, aviso de actualización
  features/     auth, home, templates, workout, history, profile, exercises
  components/   ui/ (componentes base) y brand/ (logo)
  lib/          cliente de Supabase, env, Dexie y sincronización
  services/     acceso a datos por dominio (sin JSX)
  domain/       lógica pura y testeada
  schemas/      validación con Zod
  types/        tipos de la base
  i18n/         textos en español
supabase/
  migrations/   esquema versionado
scripts/        generación de íconos, migración de ejercicios y prueba de RLS
design/         referencia visual
```

## Estado

- [x] **Fase 1 — Fundación:** proyecto, sistema visual, PWA, auth, esquema con RLS y deploy.
- [ ] **Fase 2 — Entrenamiento:** biblioteca de ejercicios, rutinas, entrenamiento offline,
      historial y récords.
- [ ] Fase 3 — Progreso corporal · Fase 4 — Nutrición · Fase 5 — Pulido.
