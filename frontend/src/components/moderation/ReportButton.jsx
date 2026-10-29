import { useState } from "react";
import toast from "react-hot-toast";
import useModerationStore from "../../store/moderationStore.js";
import { announce } from "../../lib/announce.js";

// Report action (US11) — attached to discussions, resources, and comments. Submitting hides the
// content only for this reporter (FR-028); the admin dashboard is the only path to a global hide
// (Constitution Principle VI). `onReported` lets the parent list optimistically drop the item.
export default function ReportButton({ targetType, targetId, onReported }) {
  const createReport = useModerationStore((state) => state.createReport);

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await createReport({ targetType, targetId, reason });
      setReason("");
      setIsOpen(false);
      toast.success("Report submitted.");
      announce("Report submitted.");
      onReported?.(targetId);
    } catch (envelope) {
      const message = envelope?.message || "Could not submit report.";
      setError(message);
      announce(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-destructive underline-offset-2 hover:underline"
      >
        Report
      </button>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-2 space-y-2">
      <label htmlFor={`report-reason-${targetType}-${targetId}`} className="block text-sm font-medium">
        Why are you reporting this?
      </label>
      <textarea
        id={`report-reason-${targetType}-${targetId}`}
        required
        rows={2}
        maxLength={500}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setError("");
            setReason("");
          }}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
