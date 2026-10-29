import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore.js";
import useProfileStore from "../store/profileStore.js";
import { announce } from "../lib/announce.js";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export default function Profile() {
  const setUser = useAuthStore((state) => state.setUser);

  const profile = useProfileStore((state) => state.profile);
  const activity = useProfileStore((state) => state.activity);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const uploadAvatar = useProfileStore((state) => state.uploadAvatar);
  const loadActivity = useProfileStore((state) => state.loadActivity);

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ displayName: "", bio: "" });
  const [error, setError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await loadProfile();
      if (user) {
        setForm({ displayName: user.displayName || "", bio: user.bio || "" });
      }
      await loadActivity();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSavingProfile(true);
    try {
      const user = await updateProfile({ displayName: form.displayName, bio: form.bio });
      setUser(user);
      toast.success("Profile updated.");
      announce("Profile updated.");
    } catch (envelope) {
      const message = envelope?.message || "Could not update profile.";
      setError(message);
      announce(message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > AVATAR_MAX_BYTES) {
      const message = "Profile picture must be 5 MB or smaller.";
      setError(message);
      toast.error(message);
      announce(message);
      return;
    }

    setError("");
    setIsUploadingAvatar(true);
    try {
      const user = await uploadAvatar(file);
      setUser(user);
      toast.success("Profile picture updated.");
      announce("Profile picture updated.");
    } catch (envelope) {
      const message = envelope?.message || "Could not upload profile picture.";
      setError(message);
      announce(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Your profile</h1>

      <div className="mb-8 flex items-center gap-4">
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-20 w-20 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted text-xl font-semibold text-muted-foreground"
          >
            {(profile?.displayName || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-medium"
          >
            {isUploadingAvatar ? "Uploading..." : "Change profile picture"}
          </label>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, WEBP, or GIF. Max 5 MB.</p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={profile?.email || ""}
            disabled
            className="w-full rounded-md border border-border bg-muted px-3 py-2 text-muted-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>

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
            className="w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={500}
            value={form.bio}
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
          disabled={isSavingProfile}
          className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-60"
        >
          {isSavingProfile ? "Saving..." : "Save changes"}
        </button>
      </form>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Your activity</h2>
        {activity ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Discussions posted: {activity.discussionCount}</li>
            <li>Communities joined: {activity.communitiesJoined}</li>
            <li>Communities owned: {activity.communitiesOwned}</li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Loading activity…</p>
        )}
      </section>
    </div>
  );
}
