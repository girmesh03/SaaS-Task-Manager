/**
 * Auth Slice - Authentication State Management
 *
 * Manages authentication state with:
 * - User credentials and profile
 * - Authentication status
 * - Loading states
 * - Redux persist integration
 *
 * Requirements: 1.10
 */

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Set user credentials after successful authentication
     *
     * @param {Object} action.payload - Authentication payload
     * @param {Object} action.payload.user - User object with profile data
     */
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    },

    /**
     * Clear authentication state on logout
     */
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },

    /**
     * Set loading state during authentication operations
     *
     * @param {Object} action.payload - Loading state boolean
     */
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

// Export actions
export const { setCredentials, logout, setLoading } = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Selectors
/**
 * Select current authenticated user
 * @param {Object} state - Redux state
 * @returns {Object|null} User object or null
 */
export const selectCurrentUser = (state) => state.auth.user;

/**
 * Select authentication status
 * @param {Object} state - Redux state
 * @returns {boolean} True if user is authenticated
 */
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

/**
 * Select loading state
 * @param {Object} state - Redux state
 * @returns {boolean} True if authentication operation is in progress
 */
export const selectIsLoading = (state) => state.auth.isLoading;
