/**
 * Router Configuration - React Router v7 Data Mode
 *
 * Defines all application routes with:
 * - Public routes (login, register, forgot-password, reset-password)
 * - Protected routes (dashboard, organizations, departments, users, tasks, materials, vendors)
 * - Role-based route guards
 * - Lazy loading for code splitting
 * - Error boundaries
 *
 * Requirements: 23.7
 */

import { createBrowserRouter } from "react-router";
import {
  RootLayout,
  DashboardLayout,
  PublicLayout,
} from "../components/layout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import LoadingFallback from "./LoadingFallback";
import RouteErrorBoundary from "./RouteErrorBoundary";
import { USER_ROLES } from "../utils/constants";

/**
 * Router configuration using React Router v7 data mode
 */
const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    HydrateFallback: LoadingFallback,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      // ============================================
      // PUBLIC ROUTES - No authentication required
      // ============================================
      {
        Component: PublicLayout,
        children: [
          // Landing/Home page
          {
            index: true,
            lazy: async () => {
              const m = await import("../pages/HomePage.jsx");
              return { Component: m.default };
            },
          },
          // Login page
          {
            path: "login",
            lazy: async () => {
              const m = await import("../pages/auth/LoginPage.jsx");
              return { Component: m.default };
            },
          },
          // Registration page
          {
            path: "register",
            lazy: async () => {
              const m = await import("../pages/auth/RegisterPage.jsx");
              return { Component: m.default };
            },
          },
          // Forgot password page
          {
            path: "forgot-password",
            lazy: async () => {
              const m = await import("../pages/auth/ForgotPasswordPage.jsx");
              return { Component: m.default };
            },
          },
          // Reset password page with token
          {
            path: "reset-password/:token",
            lazy: async () => {
              const m = await import("../pages/auth/ResetPasswordPage.jsx");
              return { Component: m.default };
            },
          },
        ],
      },

      // ============================================
      // PROTECTED ROUTES - Authentication required
      // ============================================
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: DashboardLayout,
            children: [
              // Dashboard
              {
                path: "dashboard",
                lazy: async () => {
                  const m = await import("../pages/DashboardPage.jsx");
                  return { Component: m.default };
                },
              },
              // Organizations - Platform SuperAdmin only
              {
                path: "organizations",
                Component: () => (
                  <RoleRoute
                    allowedRoles={[USER_ROLES.SUPER_ADMIN]}
                    requirePlatformUser
                  />
                ),
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const m = await import("../pages/OrganizationsPage.jsx");
                      return { Component: m.default };
                    },
                  },
                ],
              },
              // Departments
              {
                path: "departments",
                lazy: async () => {
                  const m = await import("../pages/DepartmentsPage.jsx");
                  return { Component: m.default };
                },
              },
              // Users
              {
                path: "users",
                lazy: async () => {
                  const m = await import("../pages/UsersPage.jsx");
                  return { Component: m.default };
                },
              },
              // Tasks
              {
                path: "tasks",
                lazy: async () => {
                  const m = await import("../pages/TasksPage.jsx");
                  return { Component: m.default };
                },
              },
              // Materials
              {
                path: "materials",
                lazy: async () => {
                  const m = await import("../pages/MaterialsPage.jsx");
                  return { Component: m.default };
                },
              },
              // Vendors
              {
                path: "vendors",
                lazy: async () => {
                  const m = await import("../pages/VendorsPage.jsx");
                  return { Component: m.default };
                },
              },
              // Profile
              {
                path: "profile",
                lazy: async () => {
                  const m = await import("../pages/ProfilePage.jsx");
                  return { Component: m.default };
                },
              },
              // Settings
              {
                path: "settings",
                lazy: async () => {
                  const m = await import("../pages/SettingsPage.jsx");
                  return { Component: m.default };
                },
              },
            ],
          },
        ],
      },

      // ============================================
      // CATCH-ALL - 404 Not Found
      // ============================================
      {
        path: "*",
        lazy: async () => {
          const m = await import("../pages/NotFoundPage.jsx");
          return { Component: m.default };
        },
      },
    ],
  },
]);

export default router;
