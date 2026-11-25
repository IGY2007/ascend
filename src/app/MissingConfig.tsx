import { Settings2 } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { t } from '@/i18n'

/** Se muestra si faltan variables de entorno: explica exactamente qué hacer. */
export function MissingConfig({ missing }: { missing: string[] }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pt-safe pb-safe">
      <Logo className="mb-8 size-10" />
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-warning/10 text-warning">
        <Settings2 className="size-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{t.config.title}</h1>
      <p className="mt-3 text-muted">{t.config.body}</p>
      <ul className="mt-4 space-y-2">
        {missing.map((name) => (
          <li key={name}>
            <code className="block rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-accent-2">
              {name}
            </code>
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
        <p>{t.config.where}</p>
        <p>{t.config.local}</p>
        <p>{t.config.deploy}</p>
      </div>
    </div>
  )
}
