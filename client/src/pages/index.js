/**
 * Pages Index - Export all page components
 *
 * Note: Pages are lazy-loaded in the router configuration,
 * so this index is primarily for reference and direct imports.
 */

// Public Pages
export { default as HomePage } from "./HomePage";
export { default as NotFoundPage } from "./NotFoundPage";

// Auth Pages
export { default as LoginPage } from "./auth/LoginPage";
export { default as RegisterPage } from "./auth/RegisterPage";
export { default as ForgotPasswordPage } from "./auth/ForgotPasswordPage";
export { default as ResetPasswordPage } from "./auth/ResetPasswordPage";

// Protected Pages
export { default as DashboardPage } from "./DashboardPage";
export { default as OrganizationsPage } from "./OrganizationsPage";
export { default as DepartmentsPage } from "./DepartmentsPage";
export { default as UsersPage } from "./UsersPage";
export { default as TasksPage } from "./TasksPage";
export { default as MaterialsPage } from "./MaterialsPage";
export { default as VendorsPage } from "./VendorsPage";
export { default as ProfilePage } from "./ProfilePage";
export { default as SettingsPage } from "./SettingsPage";
