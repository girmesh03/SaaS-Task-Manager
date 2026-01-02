/**
 * Redux Store Configuration
 *
 * Configures Redux Toolkit store with:
 * - RTK Query API slice for data fetching
 * - Auth slice with redux-persist for state persistence
 * - Middleware configuration for RTK Query
 *
 * Requirements: 1.10, 2.10, 18.1
 */

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import api from "../features/api";
import authReducer from "../features/authSlice";

// Redux persist configuration for auth state
const persistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "isAuthenticated"], // Only persist these fields
};

// Create persisted auth reducer
const persistedAuthReducer = persistReducer(persistConfig, authReducer);

// Configure Redux store
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: persistedAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(api.middleware),
});

// Setup RTK Query listeners for refetchOnFocus and refetchOnReconnect
setupListeners(store.dispatch);

// Create persistor for redux-persist
export const persistor = persistStore(store);
