import { BrowserRouter } from "react-router";
import AppErrorBoundary from "./components/common/AppErrorBoundary";
import AppRoutes from "./router/AppRoutes";

const App = () => {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AppRoutes />
      </AppErrorBoundary>
    </BrowserRouter>

  );
};

export default App;
