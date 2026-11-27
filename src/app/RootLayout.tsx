import { Outlet } from 'react-router'
import { RotateCcw } from 'lucide-react'
import { t } from '@/i18n'
import { RecoveryRedirect } from '@/features/auth/guards'

export function RootLayout() {
  return (
    <>
      <RecoveryRedirect />
      <Outlet />
      {/* iOS ignora la orientación del manifiesto: en un teléfono acostado pedimos girarlo */}
      <div className="rotate-lock" role="alert">
        <RotateCcw className="size-10 text-accent-2" />
        <p className="mt-3 text-lg font-semibold">{t.app.rotate}</p>
      </div>
    </>
  )
}
