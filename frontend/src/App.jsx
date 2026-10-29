import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import AppRoutes from "./routes/index.jsx";
import useAuthStore from "./store/authStore.js";

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate);

  // Hydrate session on load so a valid httpOnly cookie restores auth state without a login round-trip
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  );
}
