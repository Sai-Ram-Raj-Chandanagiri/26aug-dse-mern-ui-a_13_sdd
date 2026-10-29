import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import useCommunityStore from "../store/communityStore.js";
import { announce } from "../lib/announce.js";

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

// Create/Edit Community form (US3) — same component handles both modes based on the `:id` route param
export default function CommunityForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const community = useCommunityStore((state) => state.community);
  const isLoading = useCommunityStore((state) => state.isLoading);
  const loadCommunity = useCommunityStore((state) => state.loadCommunity);
  const createCommunity = useCommunityStore((state) => state.createCommunity);
  const updateCommunity = useCommunityStore((state) => state.updateCommunity);

  const [form, setForm] = useState({ name: "", description: "", visibility: "public" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      const existing = await loadCommunity(id);
      if (existing) {
        setForm({
          name: existing.name || "",
          description: existing.description || "",
          visibility: existing.visibility || "public",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const saved = isEditMode ? await updateCommunity(id, form) : await createCommunity(form);
      const message = isEditMode ? "Community updated." : "Community created.";
      toast.success(message);
      announce(message);
      navigate(`/communities/${saved.id}/edit`);
    } catch (envelope) {
      const message = envelope?.message || "Could not save community.";
      setError(message);
      announce(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditMode && isLoading && !community) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {isEditMode && (
        <Link to={`/communities/${id}`} className="mb-4 inline-block text-sm underline">
          Back to community
        </Link>
      )}
      <h1 className="mb-6 text-2xl font-semibold">
        {isEditMode ? "Edit community" : "Create a community"}
      </h1>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={60}
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={1000}
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Visibility</span>
          <div className="flex gap-4">
            {VISIBILITY_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={form.visibility === option.value}
                  onChange={handleChange}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

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
          {isSaving ? "Saving..." : isEditMode ? "Save changes" : "Create community"}
        </button>
      </form>

      {isEditMode && community && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Invite members</h2>
          <InvitationsLink communityId={community.id} />
        </section>
      )}
    </div>
  );
}

function InvitationsLink({ communityId }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/communities/${communityId}/invite`)}
      className="rounded-md border border-border px-3 py-2 text-sm font-medium"
    >
      Manage invitations
    </button>
  );
}
