import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/app/store";
import App from "./App.jsx";
import MuiLoading from "./components/common/MuiLoading";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<MuiLoading fullScreen />} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
