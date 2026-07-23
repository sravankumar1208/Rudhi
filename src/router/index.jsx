import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AdminRoute } from '../components/auth/AdminRoute'
import { PageErrorBoundary } from '../components/PageErrorBoundary'
import { Onboarding } from '../pages/Onboarding'
import { ForgotPassword } from '../pages/ForgotPassword'
import { ResetPassword } from '../pages/ResetPassword'
import { Auth } from '../pages/Auth'
import { AuthCallback } from '../pages/AuthCallback'
import { ProfileSetup } from '../pages/ProfileSetup'
import { Home } from '../pages/Home'
import { CreateRequest } from '../pages/CreateRequest'
import { RequestTracking } from '../pages/RequestTracking'
import { DonorAlert } from '../pages/DonorAlert'
import { DonorNavigation } from '../pages/DonorNavigation'
import { LogDonation } from '../pages/LogDonation'
import { DonationHistory } from '../pages/DonationHistory'
import { DonationCertificate } from '../pages/DonationCertificate'
import { Notifications } from '../pages/Notifications'
import { Hospitals } from '../pages/Hospitals'
import { Profile } from '../pages/Profile'
import { Settings } from '../pages/Settings'
import { AdminDashboard } from '../pages/AdminDashboard'
import { HospitalDetail } from '../pages/HospitalDetail'
import { AvailabilitySettings } from '../pages/AvailabilitySettings'
import { LocationSettings } from '../pages/LocationSettings'
import { MyRequests } from '../pages/MyRequests'
import { FAQ } from '../pages/FAQ'
import { About } from '../pages/About'
import { Offline } from '../pages/Offline'

const wrap = (Component) => <PageErrorBoundary><Component /></PageErrorBoundary>

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/onboarding" replace /> },

  // ── Auth / onboarding routes (public) ──────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/onboarding',
        element: wrap(Onboarding),
        loader: () => {
          if (localStorage.getItem('onboardingComplete')) {
            throw new Response('', { status: 302, headers: { Location: '/auth' } })
          }
          return null
        },
      },
      { path: '/auth', element: wrap(Auth) },
      { path: '/auth/callback', element: wrap(AuthCallback) },
      { path: '/auth/forgot-password', element: wrap(ForgotPassword) },
      { path: '/auth/reset-password', element: wrap(ResetPassword) },
    ],
  },

  // ── Protected: profile setup (authed but no profile yet) ───────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { element: <AuthLayout />, children: [{ path: '/profile-setup', element: wrap(ProfileSetup) }] },
    ],
  },

  // ── Protected: main app ────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/home', element: wrap(Home) },
          { path: '/create-request', element: wrap(CreateRequest) },
          { path: '/request-tracking/:id', element: wrap(RequestTracking) },
          { path: '/donor-alert/:requestId', element: wrap(DonorAlert) },
          { path: '/donor-navigation/:requestId', element: wrap(DonorNavigation) },
          { path: '/log-donation/:requestId', element: wrap(LogDonation) },
          { path: '/donation-history', element: wrap(DonationHistory) },
          { path: '/donation-certificate/:donationId', element: wrap(DonationCertificate) },
          { path: '/notifications', element: wrap(Notifications) },
          { path: '/hospitals', element: wrap(Hospitals) },
          { path: '/hospital/:id', element: wrap(HospitalDetail) },
          { path: '/profile', element: wrap(Profile) },
          { path: '/availability-settings', element: wrap(AvailabilitySettings) },
          { path: '/location-settings', element: wrap(LocationSettings) },
          { path: '/my-requests', element: wrap(MyRequests) },
          { path: '/settings', element: wrap(Settings) },
          { path: '/faq', element: wrap(FAQ) },
          { path: '/about', element: wrap(About) },
          { path: '/offline', element: wrap(Offline) },
        ],
      },
    ],
  },

  // ── Admin: requires authentication + admin role ────────────────────────────
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/admin', element: wrap(AdminDashboard) },
        ],
      },
    ],
  },
])
