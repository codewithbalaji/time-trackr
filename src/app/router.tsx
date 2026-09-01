import { createBrowserRouter } from "react-router"

import { AuthLayout } from "@/layouts/AuthLayout"
import { ProtectedLayout } from "@/layouts/ProtectedLayout"
import { redirectIfAuthenticated, requireSession } from "@/features/auth/lib/route-guards"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { SignupPage } from "@/features/auth/pages/SignupPage"
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage"
import {
  requireOrganization,
  redirectIfOnboarded,
  requireMemberships,
} from "@/features/organizations/lib/route-guards"
import { requirePermission } from "@/features/roles/lib/route-guards"
import { OnboardingPage } from "@/features/organizations/pages/OnboardingPage"
import { InviteAcceptPage } from "@/features/users/pages/InviteAcceptPage"
import { SelectOrganizationPage } from "@/features/organizations/pages/SelectOrganizationPage"
import { OrganizationSettingsPage } from "@/features/organizations/pages/OrganizationSettingsPage"
import { MembersPage } from "@/features/users/pages/MembersPage"
import { ProfilePage } from "@/features/users/pages/ProfilePage"
import { ClientsPage } from "@/features/clients/pages/ClientsPage"
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage"
import { TimeTrackerPage } from "@/features/time-tracking/pages/TimeTrackerPage"
import { TimesheetsPage } from "@/features/timesheets/pages/TimesheetsPage"
import { ApprovalsPage } from "@/features/approvals/pages/ApprovalsPage"
import { DashboardPage } from "@/pages/DashboardPage"

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage />, loader: redirectIfAuthenticated },
      { path: "/signup", element: <SignupPage />, loader: redirectIfAuthenticated },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/onboarding", element: <OnboardingPage />, loader: redirectIfOnboarded },
      { path: "/invite/accept", element: <InviteAcceptPage />, loader: requireSession },
      {
        path: "/select-organization",
        element: <SelectOrganizationPage />,
        loader: requireMemberships,
      },
    ],
  },
  {
    element: <ProtectedLayout />,
    loader: requireOrganization,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/time-tracking", element: <TimeTrackerPage /> },
      { path: "/timesheets", element: <TimesheetsPage /> },
      {
        path: "/approvals",
        element: <ApprovalsPage />,
        loader: requirePermission("timesheets.approve"),
      },
      { path: "/clients", element: <ClientsPage /> },
      { path: "/projects", element: <ProjectsPage /> },
      { path: "/members", element: <MembersPage /> },
      { path: "/profile", element: <ProfilePage /> },
      {
        path: "/settings",
        element: <OrganizationSettingsPage />,
        loader: requirePermission("organization.manage_settings"),
      },
    ],
  },
])
