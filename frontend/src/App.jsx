import { Navigate, Route, Routes } from "react-router-dom";
import AdminCandidateDetail from "./pages/AdminCandidateDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import CandidateSubmitted from "./pages/CandidateSubmitted";
import CandidateTest from "./pages/CandidateTest";

function RequireAuth({ children }) {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/candidate/:candidateId"
        element={
          <RequireAuth>
            <AdminCandidateDetail />
          </RequireAuth>
        }
      />
      <Route path="/candidate/submitted" element={<CandidateSubmitted />} />
      <Route path="/candidate/:token" element={<CandidateTest />} />
    </Routes>
  );
}
