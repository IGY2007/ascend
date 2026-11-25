import { Outlet } from 'react-router'
import { RecoveryRedirect } from '@/features/auth/guards'

export function RootLayout() {
  return (
    <>
      <RecoveryRedirect />
      <Outlet />
    </>
  )
}
