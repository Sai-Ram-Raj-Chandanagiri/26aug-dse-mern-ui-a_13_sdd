import InvitationsPanel from "../components/community/InvitationsPanel.jsx";

// Standalone "my pending invitations" entry point (US3) — reuses InvitationsPanel without a
// `communityId`, which hides the invite-by-email form and shows only the accept/decline list.
export default function MyInvitations() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Your invitations</h1>
      <InvitationsPanel />
    </div>
  );
}
