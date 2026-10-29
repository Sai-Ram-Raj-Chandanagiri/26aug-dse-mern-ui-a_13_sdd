import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore.js";

// Gates the Admin Dashboard route client-side for navigation convenience only; every admin action
// is independently enforced server-side by `requireAdmin` (Constitution Principle I — never UI-only).
export default function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
