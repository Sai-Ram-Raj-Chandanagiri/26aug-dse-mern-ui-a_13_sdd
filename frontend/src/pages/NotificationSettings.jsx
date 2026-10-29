import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useNotificationStore from "../store/notificationStore.js";
import { announce } from "../lib/announce.js";

const defaultForm = { newDiscussion: true, newResource: true };

// Notification Preferences settings page (US7) — per-category toggles; all categories may be
// disabled simultaneously (FR-023), there is no server-side minimum.
export default function NotificationSettings() {
  const loadPreferences = useNotificationStore((state) => state.loadPreferences);
  const updatePreferences = useNotificationStore((state) => state.updatePreferences);

  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPreferences()
      .then((preference) => setForm({ newDiscussion: preference.newDiscussion, newResource: preference.newResource }))
      .catch((envelope) => setError(envelope?.message || "Could not load preferences."))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToggle(field) {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await updatePreferences(form);
      toast.success("Preferences updated.");
      announce("Preferences updated.");
    } catch (envelope) {
      const message = envelope?.message || "Could not update preferences.";
      setError(message);
      announce(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">Notification settings</h1>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span>New discussions in my communities</span>
          <input
            type="checkbox"
            checked={form.newDiscussion}
            onChange={() => handleToggle("newDiscussion")}
          />
        </label>
        <label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span>New resources in my communities</span>
          <input type="checkbox" checked={form.newResource} onChange={() => handleToggle("newResource")} />
        </label>
        <p className="text-xs text-muted-foreground">
          You can disable all notification categories if you prefer not to be notified.
        </p>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </div>
  );
}
