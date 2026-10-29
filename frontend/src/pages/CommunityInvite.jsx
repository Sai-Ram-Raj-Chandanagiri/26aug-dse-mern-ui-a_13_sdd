import { Link, useParams } from "react-router-dom";
import InvitationsPanel from "../components/community/InvitationsPanel.jsx";

// Thin route wrapper around InvitationsPanel for owner/admin invite management (US3, T060)
export default function CommunityInvite() {
  const { id } = useParams();
  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/communities/${id}`} className="mb-4 inline-block text-sm underline">
        Back to community
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Invite members</h1>
      <InvitationsPanel communityId={id} />
    </div>
  );
}
