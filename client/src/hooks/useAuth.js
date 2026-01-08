/**
 * useAuth Hook - Authentication Hook
 *
 * Custom hook for authentication operations.
 * Provides access to auth state and mutations.
 *
 * Returns:
 * - user: Current authenticated user object
 * - isAuthenticated: Boolean indicating if user is logged in
 * - isLoading: Boolean indicating if auth operation is in progress
 * - login: Function to login user
 * - logout: Function to logout user
 * - register: Function to register new organization/user
 *
 * Requirements: 1.2, 1.6, 1.10
 */

import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsLoading,
  setCredentials,
  logout as logoutAction,
} from "../redux/features/authSlice";
import {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "../redux/features/authApi";

/**
 * useAuth hook
 *
 * @returns {Object} Auth state and functions
 * @returns {Object|null} return.user - Current authenticated user
 * @returns {boolean} return.isAuthenticated - Whether user is authenticated
 * @returns {boolean} return.isLoading - Whether auth operation is in progress
 * @returns {Function} return.login - Login function
 * @returns {Function} return.logout - Logout function
 * @returns {Function} return.register - Register function
 * @returns {Function} return.forgotPassword - Forgot password function
 * @returns {Function} return.resetPassword - Reset password function
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * // Login
 * const handleLogin = async () => {
 *   try {
 *     await login({ email, password });
 *   } catch (error) {
 *     console.error("Login failed:", error);
 *   }
 * };
 *
 * // Logout
 * const handleLogout = async () => {
 *   await logout();
 * };
 *
 * // Check authentication
 * if (isAuthenticated) {
 *   console.log("User is logged in:", user.fullName);
 * }
 */
export const useAuth = () => {
  const dispatch = useDispatch();

  // Select auth state from Redux store
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);

  // Get auth mutations from RTK Query
  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [logoutMutation, { isLoading: isLogoutLoading }] = useLogoutMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] =
    useRegisterMutation();
  const [forgotPasswordMutation, { isLoading: isForgotPasswordLoading }] =
    useForgotPasswordMutation();
  const [resetPasswordMutation, { isLoading: isResetPasswordLoading }] =
    useResetPasswordMutation();

  /**
   * Login user
   *
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   *
   * @returns {Promise<Object>} Login response with user object
   *
   * @throws {Error} Login error from API
   */
  const login = async (credentials) => {
    const response = await loginMutation(credentials).unwrap();

    // Backend response format: { success, message, data: { user } }
    dispatch(setCredentials({ user: response.data.user }));

    return response;
  };

  /**
   * Logout user
   *
   * Clears auth state and HTTP-only cookies.
   * Disconnects Socket.IO connection.
   *
   * @returns {Promise<void>}
   *
   * @throws {Error} Logout error from API
   */
  const logout = async () => {
    try {
      await logoutMutation().unwrap();

      // Clear Redux auth state
      dispatch(logoutAction());
    } catch (error) {
      // Even if API call fails, clear local auth state
      dispatch(logoutAction());

      // Re-throw error for component to handle
      throw error;
    }
  };

  /**
   * Register new organization and user
   *
   * Creates organization, department, and user in single transaction.
   * First user is automatically assigned SuperAdmin role.
   *
   * @param {Object} registrationData - Registration data
   * @param {Object} registrationData.organization - Organization details
   * @param {Object} registrationData.department - Department details
   * @param {Object} registrationData.user - User details
   *
   * @returns {Promise<Object>} Registration response with user object
   *
   * @throws {Error} Registration error from API
   */
  const register = async (registrationData) => {
    const response = await registerMutation(registrationData).unwrap();

    // Backend response format: { success, message, data: user }
    // createdResponse passes user directly as data (not wrapped in { user })
    dispatch(setCredentials({ user: response.data }));

    return response;
  };

  /**
   * Forgot password request
   *
   * @param {Object} data - Forgot password data
   * @param {string} data.email - User email
   *
   * @returns {Promise<Object>} Forgot password response
   */
  const forgotPassword = async (data) => {
    return await forgotPasswordMutation(data).unwrap();
  };

  /**
   * Reset password request
   *
   * @param {Object} data - Reset password data
   * @param {string} data.token - Reset token
   * @param {string} data.newPassword - New password
   * @param {string} data.confirmPassword - Confirm password
   *
   * @returns {Promise<Object>} Reset password response
   */
  const resetPassword = async (data) => {
    return await resetPasswordMutation(data).unwrap();
  };

  return {
    user,
    isAuthenticated,
    isLoading:
      isLoading ||
      isLoginLoading ||
      isLogoutLoading ||
      isRegisterLoading ||
      isForgotPasswordLoading ||
      isResetPasswordLoading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
  };
};

export default useAuth;
