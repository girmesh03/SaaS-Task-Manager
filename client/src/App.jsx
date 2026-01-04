/**
 * App Component - Main Application Entry
 *
 * Renders the router provider with the configured routes.
 * All providers (Redux, Theme, Localization) are set up in main.jsx.
 *
 * Requirements: 23.7
 */

import { RouterProvider } from "react-router";
import { router } from "./router";
import MuiLoading from "./components/common/MuiLoading";

const App = () => {
  return (
    <RouterProvider
      router={router}
      fallbackElement={
        <MuiLoading fullScreen message="Loading application..." />
      }
    />
  );
};

export default App;
