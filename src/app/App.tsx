import { RouterProvider } from 'react-router'
import { Providers } from './providers'
import { router } from './router'
import { Splash } from './Splash'
import { UpdatePrompt } from './UpdatePrompt'

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <UpdatePrompt />
      <Splash />
    </Providers>
  )
}
