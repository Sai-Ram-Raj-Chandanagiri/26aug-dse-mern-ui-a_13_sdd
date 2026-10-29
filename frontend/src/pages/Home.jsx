import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore.js";

// Home page — entry points into the app's core flows, auth-aware so an unauthenticated visitor
// can reach Register/Login and an authenticated user can jump straight to Communities/Profile.
export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-semibold">Welcome to Roundtable</h1>
      <p className="mb-8 text-muted-foreground">
        Join communities, start discussions, and share resources with people who share your interests.
      </p>

      {isAuthenticated ? (
        <div className="flex flex-wrap gap-3">
          <Link
            to="/communities"
            className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Browse communities
          </Link>
          <Link to="/communities/new" className="rounded-md border border-border px-4 py-2 font-medium">
            Create a community
          </Link>
          <Link to="/profile" className="rounded-md border border-border px-4 py-2 font-medium">
            View profile
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link to="/register" className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">
            Sign up
          </Link>
          <Link to="/login" className="rounded-md border border-border px-4 py-2 font-medium">
            Log in
          </Link>
        </div>
      )}
    </div>
  );
}
