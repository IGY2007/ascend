import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Compass, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/i18n'

export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  if (!notFound) console.error(error)

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 pt-safe pb-safe text-center">
      <div className="mb-5 grid size-16 place-items-center rounded-2xl border border-border bg-card text-muted">
        {notFound ? <Compass className="size-7" /> : <TriangleAlert className="size-7" />}
      </div>
      <h1 className="text-xl font-semibold">{notFound ? t.notFound.title : t.error.title}</h1>
      {!notFound && <p className="mt-2 text-muted">{t.error.body}</p>}
      <div className="mt-6">
        {notFound ? (
          <Button asChild>
            <Link to="/">{t.notFound.action}</Link>
          </Button>
        ) : (
          <Button onClick={() => window.location.reload()}>{t.error.reload}</Button>
        )}
      </div>
    </div>
  )
}
