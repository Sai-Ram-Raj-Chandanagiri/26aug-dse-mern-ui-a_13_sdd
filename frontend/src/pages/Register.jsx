import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore.js";
import { announce } from "../lib/announce.js";

const initialForm = { email: "", password: "", displayName: "" };

export default function Register() {
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (!form.displayName.trim()) {
      nextErrors.displayName = "Display name is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) {
      announce("Please fix the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await register(form);
      const message = "Registration successful. Check your confirmation code (printed to server console).";
      toast.success(message);
      announce(message);
      navigate(`/verify-email?userId=${encodeURIComponent(data.userId)}`);
    } catch (envelope) {
      const message = envelope?.message || "Registration failed.";
      if (envelope?.code === "EMAIL_IN_USE") {
        setErrors({ email: message });
      }
      announce(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            Display name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            value={form.displayName}
            onChange={handleChange}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? "displayName-error" : undefined}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
          {errors.displayName && (
            <p id="displayName-error" role="alert" className="mt-1 text-sm text-destructive">
              {errors.displayName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1 text-sm text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1 text-sm text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
