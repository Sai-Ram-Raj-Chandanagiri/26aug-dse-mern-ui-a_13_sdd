import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore.js";
import { announce } from "../lib/announce.js";

export default function VerifyEmail() {
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ userId: searchParams.get("userId") || "", code: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await verifyEmail(form);
      toast.success("Email verified.");
      announce("Email verified.");
      navigate("/login");
    } catch (envelope) {
      const message = envelope?.message || "Invalid or expired confirmation code.";
      setError(message);
      announce(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-semibold">Confirm your email</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter the confirmation code printed to the server console.
      </p>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userId" className="mb-1 block text-sm font-medium">
            User ID
          </label>
          <input
            id="userId"
            name="userId"
            type="text"
            value={form.userId}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-medium">
            Confirmation code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            value={form.code}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
