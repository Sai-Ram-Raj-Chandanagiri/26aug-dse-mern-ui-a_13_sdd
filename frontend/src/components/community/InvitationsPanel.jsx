import { useState } from "react";
import toast from "react-hot-toast";
import useCommunityStore from "../../store/communityStore.js";
import { announce } from "../../lib/announce.js";

// Invite-members UI (US3): invite-by-email form (shown when `communityId` is provided, i.e. the
// owner/admin is managing a specific community) plus the current user's own pending invitations
// with accept/decline actions, so the "invite appears for them" independent test is observable.
export default function InvitationsPanel({ communityId }) {
  const invitations = useCommunityStore((state) => state.invitations);
  const loadMyInvitations = useCommunityStore((state) => state.loadMyInvitations);
  const invite = useCommunityStore((state) => state.invite);
  const acceptInvitation = useCommunityStore((state) => state.acceptInvitation);
  const declineInvitation = useCommunityStore((state) => state.declineInvitation);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  async function refreshInvitations() {
    setIsLoadingInvitations(true);
    try {
      await loadMyInvitations();
    } finally {
      setIsLoadingInvitations(false);
      setHasLoaded(true);
    }
  }

  if (!hasLoaded && !isLoadingInvitations) {
    refreshInvitations();
  }

  async function handleInvite(event) {
    event.preventDefault();
    setError("");
    setIsInviting(true);
    try {
      await invite(communityId, email);
      setEmail("");
      toast.success("Invitation sent.");
      announce("Invitation sent.");
    } catch (envelope) {
      const message = envelope?.message || "Could not send invitation.";
      setError(message);
      announce(message);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleAccept(invitationId) {
    try {
      await acceptInvitation(invitationId);
      toast.success("Invitation accepted.");
      announce("Invitation accepted.");
    } catch (envelope) {
      const message = envelope?.message || "Could not accept invitation.";
      toast.error(message);
      announce(message);
    }
  }

  async function handleDecline(invitationId) {
    try {
      await declineInvitation(invitationId);
      toast.success("Invitation declined.");
      announce("Invitation declined.");
    } catch (envelope) {
      const message = envelope?.message || "Could not decline invitation.";
      toast.error(message);
      announce(message);
    }
  }

  return (
    <div className="space-y-8">
      {communityId && (
        <form noValidate onSubmit={handleInvite} className="space-y-3">
          <div>
            <label htmlFor="invite-email" className="mb-1 block text-sm font-medium">
              Invite by email
            </label>
            <div className="flex gap-2">
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
              <button
                type="submit"
                disabled={isInviting}
                className="whitespace-nowrap rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground disabled:opacity-60"
              >
                {isInviting ? "Inviting..." : "Send invite"}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      )}

      <div>
        <h3 className="mb-3 text-base font-semibold">Your pending invitations</h3>
        {isLoadingInvitations && invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        ) : (
          <ul className="space-y-2">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm">
                  {typeof invitation.community === "object"
                    ? invitation.community.name
                    : "A community"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(invitation.id)}
                    className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(invitation.id)}
                    className="rounded-md border border-border px-3 py-1 text-sm font-medium"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
