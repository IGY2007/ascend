import { RouterProvider } from 'react-router'
import { missingEnv } from '@/lib/env'
import { Providers } from './providers'
import { router } from './router'
import { Splash } from './Splash'
import { UpdatePrompt } from './UpdatePrompt'
import { MissingConfig } from './MissingConfig'

export function App() {
  if (missingEnv.length > 0) return <MissingConfig missing={missingEnv} />

  return (
    <Providers>
      <RouterProvider router={router} />
      <UpdatePrompt />
      <Splash />
    </Providers>
  )
}
