import { createBrowserRouter } from "react-router"

import { AuthLayout } from "@/layouts/AuthLayout"
import { ProtectedLayout } from "@/layouts/ProtectedLayout"
import { redirectIfAuthenticated, requireSession } from "@/features/auth/lib/route-guards"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { SignupPage } from "@/features/auth/pages/SignupPage"
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage"
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
    ],
  },
  {
    element: <ProtectedLayout />,
    loader: requireSession,
    children: [{ path: "/", element: <DashboardPage /> }],
  },
])
