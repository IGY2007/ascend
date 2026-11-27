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
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { RequireOnboarding } from '@/features/onboarding/RequireOnboarding'
import { WorkoutDetailPage } from '@/features/templates/WorkoutDetailPage'
import { ActiveWorkoutPage } from '@/features/workout/ActiveWorkoutPage'
import { SummaryPage } from '@/features/workout/SummaryPage'
import { EditSessionPage } from '@/features/workout/EditSessionPage'
import { SharePage } from '@/features/share/SharePage'
import { DayPage } from '@/features/calendar/DayPage'
import { NutritionPage } from '@/features/nutrition/NutritionPage'
import { AvatarEditorPage } from '@/features/avatar/AvatarEditorPage'
import { PhysiquePage } from '@/features/game/PhysiquePage'
import { JourneyPage } from '@/features/journey/JourneyPage'
import { SettingsPage } from '@/features/profile/SettingsPage'
import { EditDataPage } from '@/features/profile/EditDataPage'

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
          { path: '/onboarding', element: <OnboardingPage /> },
          {
            element: <RequireOnboarding />,
            children: [
              { path: '/workout/:id', element: <ActiveWorkoutPage /> },
              { path: '/workout/:id/summary', element: <SummaryPage /> },
              { path: '/workout/:id/edit', element: <EditSessionPage /> },
              { path: '/workout/:id/share', element: <SharePage /> },
              { path: '/share/month/:ym', element: <SharePage /> },
              {
                element: <AppLayout />,
                children: [
                  { path: '/', element: <HomePage /> },
                  { path: '/workouts', element: <WorkoutsPage /> },
                  { path: '/workouts/:id', element: <WorkoutDetailPage /> },
                  { path: '/progress', element: <ProgressPage /> },
                  { path: '/day/:date', element: <DayPage /> },
                  { path: '/nutrition', element: <NutritionPage /> },
                  { path: '/avatar', element: <AvatarEditorPage /> },
                  { path: '/physique', element: <PhysiquePage /> },
                  { path: '/journey', element: <JourneyPage /> },
                  { path: '/settings', element: <SettingsPage /> },
                  { path: '/settings/data', element: <EditDataPage /> },
                  { path: '/profile', element: <ProfilePage /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
