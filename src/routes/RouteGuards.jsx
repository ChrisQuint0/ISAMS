import { Navigate } from "react-router-dom";
// import { useAuth } from "@/features/auth/hooks/useAuth";

// Protected Route wrapper
export function ProtectedRoute({ children }) {
  // const { user } = useAuth();

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return children;
}

// Public Route wrapper (redirect to dashboard if already logged in)
export function PublicRoute({ children }) {
  // const { user } = useAuth();

  // if (user) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  return children;
}