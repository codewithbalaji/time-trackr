import { createBrowserRouter, redirect } from "react-router"

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
import { MembersPage } from "@/features/users/pages/MembersPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { ClientsPage } from "@/features/clients/pages/ClientsPage"
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage"
import { TimeTrackerPage } from "@/features/time-tracking/pages/TimeTrackerPage"
import { TimesheetsPage } from "@/features/timesheets/pages/TimesheetsPage"
import { ApprovalsPage } from "@/features/approvals/pages/ApprovalsPage"
import { NotificationsPage } from "@/features/notifications/pages/NotificationsPage"
import { DashboardPage } from "@/features/reports/pages/DashboardPage"
import { ReportsPage } from "@/features/reports/pages/ReportsPage"
import { AuditLogPage } from "@/features/audit/pages/AuditLogPage"

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage />, loader: redirectIfAuthenticated },
      { path: "/signup", element: <SignupPage />, loader: redirectIfAuthenticated },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
        loader: redirectIfAuthenticated,
      },
      // Reachable only with the session a recovery link establishes — without
      // this guard the form submits into an AuthSessionMissingError with no
      // way forward.
      { path: "/reset-password", element: <ResetPasswordPage />, loader: requireSession },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/onboarding", element: <OnboardingPage />, loader: redirectIfOnboarded },
      // Public: an invitee usually has no account yet. The page reads the
      // invitation token from the URL and handles the signed-out, signed-in,
      // and wrong-account cases itself.
      { path: "/invite/accept", element: <InviteAcceptPage /> },
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
      { path: "/reports", element: <ReportsPage /> },
      { path: "/notifications", element: <NotificationsPage /> },
      { path: "/members", element: <MembersPage /> },
      // Account settings moved into /settings as a tab. Kept as a redirect
      // rather than deleted: it was a real route, and anything bookmarked or
      // linked to it should still land somewhere sensible.
      {
        path: "/profile",
        loader: () => redirect("/settings?tab=account"),
        element: null,
      },
      {
        path: "/audit-log",
        element: <AuditLogPage />,
        loader: requirePermission("audit_logs.view"),
      },
      // No permission loader: the page is readable by every member and only
      // the writes are gated (RLS enforces that anyway). Gating the route on
      // organization.manage_settings locked out Admins, who are deliberately
      // denied that permission by the RBAC seed — and the Account tab is
      // nobody's business but the signed-in user's.
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
])
