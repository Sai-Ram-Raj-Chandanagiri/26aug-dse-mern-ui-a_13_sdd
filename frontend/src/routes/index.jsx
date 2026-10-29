import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Register from "../pages/Register.jsx";
import Login from "../pages/Login.jsx";
import VerifyEmail from "../pages/VerifyEmail.jsx";
import AccountRecovery from "../pages/AccountRecovery.jsx";
import Profile from "../pages/Profile.jsx";
import CommunityForm from "../pages/CommunityForm.jsx";
import CommunityInvite from "../pages/CommunityInvite.jsx";
import MyInvitations from "../pages/MyInvitations.jsx";
import CommunityBrowse from "../pages/CommunityBrowse.jsx";
import CommunityDetail from "../pages/CommunityDetail.jsx";
import DiscussionThread from "../pages/DiscussionThread.jsx";
import ResourceList from "../pages/ResourceList.jsx";
import NotificationSettings from "../pages/NotificationSettings.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import SavedItems from "../pages/SavedItems.jsx";
import Inbox from "../pages/Inbox.jsx";
import ConversationDetail from "../pages/ConversationDetail.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";

// Route tree (Constitution: Technology & Implementation Constraints — react-router-dom
// BrowserRouter; the router itself is mounted once in main.jsx so AppShell's nav can use
// Link/useNavigate). Page components are added per user story in later implementation phases.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<AccountRecovery />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communities"
        element={
          <ProtectedRoute>
            <CommunityBrowse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communities/new"
        element={
          <ProtectedRoute>
            <CommunityForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communities/:id"
        element={
          <ProtectedRoute>
            <CommunityDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communities/:id/edit"
        element={
          <ProtectedRoute>
            <CommunityForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communities/:id/invite"
        element={
          <ProtectedRoute>
            <CommunityInvite />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invitations"
        element={
          <ProtectedRoute>
            <MyInvitations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discussions/:id"
        element={
          <ProtectedRoute>
            <DiscussionThread />
          </ProtectedRoute>
        }
      />
      <Route
        path="/communities/:id/resources"
        element={
          <ProtectedRoute>
            <ResourceList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications/settings"
        element={
          <ProtectedRoute>
            <NotificationSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/saved-items"
        element={
          <ProtectedRoute>
            <SavedItems />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute>
            <Inbox />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbox/:id"
        element={
          <ProtectedRoute>
            <ConversationDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
    </Routes>
  );
}
