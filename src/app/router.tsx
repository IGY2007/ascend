import { createHashRouter, Navigate } from 'react-router'
import { RootLayout } from './RootLayout'
import { RouteError } from './RouteError'
import { AppLayout } from './layout/AppLayout'
import { PublicOnly, RequireAuth } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { HomePage } from '@/features/home/HomePage'
import { WorkoutsPage } from '@/features/templates/WorkoutsPage'
import { ProgressPage } from '@/features/history/ProgressPage'
import { ProfilePage } from '@/features/profile/ProfilePage'

// HashRouter: GitHub Pages no puede resolver rutas del lado del servidor.
export const router = createHashRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicOnly />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { path: '/reset-password', element: <ResetPasswordPage /> },
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <HomePage /> },
              { path: '/workouts', element: <WorkoutsPage /> },
              { path: '/progress', element: <ProgressPage /> },
              { path: '/profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
