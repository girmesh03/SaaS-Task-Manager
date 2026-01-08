/**
 * Main Entry Point - Frontend Application
 *
 * Wraps the application with required providers:
 * - StrictMode: React strict mode for development warnings
 * - Provider: Redux store provider for state management
 * - PersistGate: Redux persist gate for rehydration
 * - LocalizationProvider: MUI date pickers localization with dayjs
 *
 * Note: AppTheme and ToastContainer are handled in RootLayout.
 *
 * Configures dayjs with UTC and timezone plugins for proper date handling.
 *
 * Requirements: 29.1, 29.2, 26.1, 26.2
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import CssBaseline from "@mui/material/CssBaseline";
import AppTheme from "./theme/AppTheme";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { store, persistor } from "./redux/app/store";
import App from "./App.jsx";
import { MuiLoading } from "./components/common";

// Configure dayjs with UTC and timezone plugins
// This ensures all date operations are timezone-aware
dayjs.extend(utc);
dayjs.extend(timezone);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<MuiLoading fullScreen message="Loading State..." />} persistor={persistor}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AppTheme>
            <CssBaseline />
            <App />
          </AppTheme>
        </LocalizationProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
