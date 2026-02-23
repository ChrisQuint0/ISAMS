import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

export function ProtectedReportsRoute({ children }) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkUserRole() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user permissions from Supabase
        console.log("=== REPORTS ROUTE DEBUG ===");
        console.log("User ID:", user.id);
        console.log("User Email:", user.email);
        
        const { data, error } = await supabase
          .from("users_with_roles")
          .select("*")
          .eq("id", user.id);

        console.log("Database Query - Error:", error);
        console.log("Database Query - Data:", data);
        
        if (error) {
          console.error("Full error details:", JSON.stringify(error, null, 2));
          setAuthorized(false);
        } else if (data && data.length > 0) {
          const userData = data[0];
          console.log("User Data Structure:", JSON.stringify(userData, null, 2));
          
          // Check if user has access to reports (thesis module)
          // Can access if thesis is true and thesis_role is "admin"
          const hasThesisAccess = userData?.thesis === true && userData?.thesis_role === "admin";
          
          console.log("Has thesis access?", hasThesisAccess);
          console.log("User thesis_role:", userData?.thesis_role);
          
          setUserRole(userData?.thesis_role);
          setAuthorized(hasThesisAccess);
        } else {
          console.warn("No user data found");
          setAuthorized(false);
        }
      } catch (error) {
        console.error("Error in role check:", error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    }

    checkUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!authorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
