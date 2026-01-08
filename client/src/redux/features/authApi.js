/**
 * Auth API - Authentication Endpoints
 *
 * RTK Query endpoints for authentication operations:
 * - Login: POST /api/auth/login
 * - Register: POST /api/auth/register
 * - Logout: DELETE /api/auth/logout
 * - Forgot Password: POST /api/auth/forgot-password
 * - Reset Password: POST /api/auth/reset-password
 *
 * All endpoints use HTTP-only cookies for authentication.
 * Rate limited to 5 requests per 15 minutes in production.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.10
 */

import api from "./api";

/**
 * Auth API slice
 *
 * Extends base API with authentication endpoints.
 * No cache tags needed as auth operations don't cache data.
 */
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Login mutation
     *
     * POST /api/auth/login
     *
     * Authenticates user with email and password.
     * Sets HTTP-only cookies (accessToken, refreshToken).
     * Updates lastLogin timestamp.
     * Emits Socket.IO 'user:online' event.
     *
     * @param {Object} credentials - Login credentials
     * @param {string} credentials.email - User email
     * @param {string} credentials.password - User password
     *
     * @returns {Object} Response with user object
     * @returns {Object} response.data.user - Authenticated user with populated organization and department
     *
     * @throws {401} Invalid email or password
     * @throws {401} User account has been deactivated
     * @throws {401} Organization has been deactivated
     * @throws {401} Department has been deactivated
     *
     * Requirements: 1.2, 1.10
     */
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    /**
     * Register mutation
     *
     * POST /api/auth/register
     *
     * Registers new organization, department, and user in a single transaction.
     * First user is automatically assigned SuperAdmin role and HOD status.
     * Sends welcome email asynchronously.
     * Emits Socket.IO events for organization, department, and user creation.
     *
     * @param {Object} registrationData - Registration data
     * @param {Object} registrationData.organization - Organization details
     * @param {string} registrationData.organization.name - Organization name (max 100, lowercase, unique)
     * @param {string} registrationData.organization.description - Organization description (max 2000, optional)
     * @param {string} registrationData.organization.email - Organization email (max 50, unique)
     * @param {string} registrationData.organization.phone - Organization phone (Ethiopian format, unique)
     * @param {string} registrationData.organization.address - Organization address (max 500, optional)
     * @param {string} registrationData.organization.industry - Industry (max 100, optional)
     * @param {Object} registrationData.organization.logo - Logo (optional)
     * @param {string} registrationData.organization.logo.url - Cloudinary URL
     * @param {string} registrationData.organization.logo.publicId - Cloudinary public ID
     * @param {Object} registrationData.department - Department details
     * @param {string} registrationData.department.name - Department name (max 100)
     * @param {string} registrationData.department.description - Department description (max 2000, optional)
     * @param {Object} registrationData.user - User details
     * @param {string} registrationData.user.firstName - First name (max 20)
     * @param {string} registrationData.user.lastName - Last name (max 20)
     * @param {string} registrationData.user.position - Position (max 100, optional)
     * @param {string} registrationData.user.email - Email (max 50)
     * @param {string} registrationData.user.password - Password (min 8, strong)
     * @param {string} registrationData.user.employeeId - Employee ID (4-digit 0001-9999, optional)
     * @param {string} registrationData.user.dateOfBirth - Date of birth (ISO format, not future, optional)
     * @param {string} registrationData.user.joinedAt - Joined date (ISO format, not future, required)
     *
     * @returns {Object} Response with created user object
     * @returns {Object} response.data - Created user with populated organization and department
     *
     * @throws {400} Validation errors (name exists, email exists, phone exists, invalid format)
     * @throws {500} Transaction failure
     *
     * Requirements: 1.1, 1.7, 1.8, 1.9, 1.10
     */
    register: builder.mutation({
      query: (registrationData) => ({
        url: "/auth/register",
        method: "POST",
        body: registrationData,
      }),
    }),

    /**
     * Logout mutation
     *
     * DELETE /api/auth/logout
     *
     * Logs out current user.
     * Clears HTTP-only cookies (accessToken, refreshToken).
     * Emits Socket.IO 'user:offline' event.
     *
     * @returns {Object} Response with success message
     *
     * @throws {401} Not authenticated
     *
     * Requirements: 1.6, 1.10
     */
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "DELETE",
      }),
    }),

    /**
     * Forgot password mutation
     *
     * POST /api/auth/forgot-password
     *
     * Sends password reset email if user exists.
     * Always returns success to prevent email enumeration.
     * Generates password reset token with 1-hour expiration.
     *
     * @param {Object} data - Forgot password data
     * @param {string} data.email - User email
     *
     * @returns {Object} Response with generic success message
     * @returns {string} response.message - "If an account with that email exists, a password reset link has been sent"
     *
     * Requirements: 1.3, 1.10
     */
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Reset password mutation
     *
     * POST /api/auth/reset-password
     *
     * Resets user password using reset token.
     * Validates token and expiration.
     * Clears reset token after successful reset.
     * Sends password reset confirmation email.
     *
     * @param {Object} data - Reset password data
     * @param {string} data.token - Password reset token from email
     * @param {string} data.password - New password (min 8, strong)
     *
     * @returns {Object} Response with success message
     * @returns {string} response.message - "Password reset successful. You can now login with your new password"
     *
     * @throws {400} Invalid or expired reset token
     * @throws {400} Validation errors (weak password)
     *
     * Requirements: 1.4, 1.5, 1.10
     */
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: "POST",
        body: { password },
      }),
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
