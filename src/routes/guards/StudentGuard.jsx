import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

const isStudent = (rbac) => {
  if (!rbac) return true; // If no RBAC defined, treat as student (regular user)
  // A student is someone who is NOT an admin
  const isAdmin =
    rbac.superadmin === true ||
    rbac.thesis_role === 'admin' ||
    rbac.facsub_role === 'admin' ||
    rbac.labman_role === 'admin' ||
    rbac.studvio_role === 'admin';
  return !isAdmin;
};

export function StudentGuard({ children }) {
  const { rbac, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--background, #0f172a)",
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "4px solid rgba(255,255,255,0.1)",
          borderTopColor: "rgba(255,255,255,0.6)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isStudent(rbac)) {
    // If they're an admin, redirect to dashboard
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return children;
}
