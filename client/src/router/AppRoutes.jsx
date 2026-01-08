/**
 * AppRoutes Component - Declarative Routes Configuration
 *
 * Defines all application routes using React Router v7 Declarative Mode.
 * Replaces the data-router configuration in routes.jsx.
 *
 * Requirements: 23.7, Task 9
 */

import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";

// Layouts
import {
  RootLayout,
  PublicLayout,
  ProtectedLayout,
} from "../components/layout";
import NotFoundPage from "../pages/NotFoundPage";
import { MuiLoading } from "../components/common";

// Lazy Loaded Pages and Forms
const HomePage = lazy(() => import("../pages/HomePage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));

const LoginForm = lazy(() => import("../components/forms/auth/LoginForm"));
const RegisterForm = lazy(() => import("../components/forms/auth/RegisterForm"));

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const OrganizationsPage = lazy(() => import("../pages/OrganizationsPage"));
const DepartmentsPage = lazy(() => import("../pages/DepartmentsPage"));
const DepartmentDetailPage = lazy(() => import("../pages/DepartmentDetailPage"));
const UsersPage = lazy(() => import("../pages/UsersPage"));
const UserDetailPage = lazy(() => import("../pages/UserDetailPage"));
const TasksPage = lazy(() => import("../pages/TasksPage"));
const TaskDetailPage = lazy(() => import("../pages/TaskDetailPage"));
const MaterialsPage = lazy(() => import("../pages/MaterialsPage"));
const VendorsPage = lazy(() => import("../pages/VendorsPage"));

// Guards
import AuthGuard from "./AuthGuard";
import GuestGuard from "./GuestGuard";

const AppRoutes = () => {
  return (

    <Routes>
      <Route element={<RootLayout />}>
        {/* PUBLIC ROUTES (Guest Only) */}
        <Route element={
          <GuestGuard>
            <PublicLayout />
          </GuestGuard>
        }>
          <Route
            index
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Home..." />}>
                <HomePage />
              </Suspense>
            }
          />
          <Route
            path="login"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Login..." />}>
                <LoginForm />
              </Suspense>
            }
          />
          <Route
            path="register"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Register..." />}>
                <RegisterForm />
              </Suspense>
            }
          />
          <Route
            path="forgot-password"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Forgot Password..." />}>
                <ForgotPasswordPage />
              </Suspense>
            }
          />
          <Route
            path="reset-password/:token?"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Reset Password..." />}>
                <ResetPasswordPage />
              </Suspense>
            }
          />
        </Route>

        {/* PROTECTED ROUTES (Auth Only) */}
        <Route
          element={
            <AuthGuard>
              <ProtectedLayout />
            </AuthGuard>
          }
        >
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Dashboard..." />}>
                <DashboardPage />
              </Suspense>
            }
          />

          {/* Organizations - Platform SuperAdmin only */}
          <Route
            path="organizations"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Organizations..." />}>
                <OrganizationsPage />
              </Suspense>
            }
          />

          <Route
            path="departments"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Departments..." />}>
                <DepartmentsPage />
              </Suspense>
            }
          />
          <Route
            path="departments/:departmentId"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Department Detail..." />}>
                <DepartmentDetailPage />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Users..." />}>
                <UsersPage />
              </Suspense>
            }
          />
          <Route
            path="users/:userId"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading User Detail..." />}>
                <UserDetailPage />
              </Suspense>
            }
          />
          <Route
            path="tasks"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Tasks..." />}>
                <TasksPage />
              </Suspense>
            }
          />
          <Route
            path="tasks/:taskId"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Task Detail..." />}>
                <TaskDetailPage />
              </Suspense>
            }
          />
          <Route
            path="materials"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Materials..." />}>
                <MaterialsPage />
              </Suspense>
            }
          />
          <Route
            path="vendors"
            element={
              <Suspense fallback={<MuiLoading fullScreen message="Loading Vendors..." />}>
                <VendorsPage />
              </Suspense>
            }
          />
        </Route>

        {/* CATCH-ALL */}
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
