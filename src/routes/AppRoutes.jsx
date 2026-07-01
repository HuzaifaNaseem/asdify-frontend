import { Route, Routes } from 'react-router-dom'

import { MainLayout } from '../components/layout/MainLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { DoctorRegistrationPendingPage } from '../pages/auth/DoctorRegistrationPendingPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { LandingPage } from '../pages/public/LandingPage'
import { AboutPage } from '../pages/public/AboutPage'
import { PrivacyPolicyPage } from '../pages/public/PrivacyPolicyPage'
import { NotFoundPage } from '../pages/public/NotFoundPage'
import { ApiStatusPage } from '../pages/public/ApiStatusPage'
import { UnauthorizedPage } from '../pages/public/UnauthorizedPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { AssessmentResultPage } from '../pages/AssessmentResultPage'
import { HistoryDetailPage } from '../pages/HistoryDetailPage'
import { DoctorPatientDetailPage } from '../pages/DoctorPatientDetailPage'
import { ScreeningPage } from '../pages/ScreeningPage'
import { AssessmentNewPage } from '../pages/AssessmentNewPage'
import { HistoryPage } from '../pages/HistoryPage'
import { ParentAsdTestsPage } from '../pages/ParentAsdTestsPage'
import { ParentDashboardPage } from '../pages/ParentDashboardPage'
import { VideoAssessmentPage } from '../pages/VideoAssessmentPage'
import { DoctorDashboardPage } from '../pages/DoctorDashboardPage'
import { DoctorPatientsPage } from '../pages/DoctorPatientsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminReportsPage } from '../pages/admin/AdminReportsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/api-status" element={<ApiStatusPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/pending" element={<DoctorRegistrationPendingPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['parent']}>
              <ParentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/asd-tests"
          element={
            <ProtectedRoute roles={['parent']}>
              <ParentAsdTestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/video"
          element={
            <ProtectedRoute roles={['parent']}>
              <VideoAssessmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/new"
          element={<AssessmentNewPage />}
        />
        <Route
          path="/assessment/result/:id"
          element={<AssessmentResultPage />}
        />
        <Route
          path="/screening"
          element={<ScreeningPage />}
        />
        <Route
          path="/history"
          element={<HistoryPage />}
        />
        <Route
          path="/history/:id"
          element={<HistoryDetailPage />}
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={['parent', 'doctor', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute roles={['doctor']}>
              <DoctorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute roles={['doctor']}>
              <DoctorPatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients/:id"
          element={
            <ProtectedRoute roles={['doctor']}>
              <DoctorPatientDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/models"
          element={
            <ProtectedRoute roles={['admin']}>
              <PlaceholderPage
                title="Model management"
                description="Active model version, history, and promotion workflow."
                documentTitle="Asdify — Models"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminReportsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
