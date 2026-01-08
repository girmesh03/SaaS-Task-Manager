/**
 * Pages Index - Export all page components
 *
 * Note: Pages are lazy-loaded in the router configuration,
 * so this index is primarily for reference and direct imports.
 */

// Public Pages
export { default as HomePage } from "./HomePage";
export { default as NotFoundPage } from "./NotFoundPage";
export { default as ForgotPasswordPage } from "./ForgotPasswordPage";
export { default as ResetPasswordPage } from "./ResetPasswordPage";

// Protected Pages
export { default as DashboardPage } from "./DashboardPage";
export { default as OrganizationsPage } from "./OrganizationsPage";
export { default as DepartmentsPage } from "./DepartmentsPage";
export { default as DepartmentDetailPage } from "./DepartmentDetailPage";
export { default as UsersPage } from "./UsersPage";
export { default as UserDetailPage } from "./UserDetailPage";
export { default as TasksPage } from "./TasksPage";
export { default as TaskDetailPage } from "./TaskDetailPage";
export { default as MaterialsPage } from "./MaterialsPage";
export { default as VendorsPage } from "./VendorsPage";
