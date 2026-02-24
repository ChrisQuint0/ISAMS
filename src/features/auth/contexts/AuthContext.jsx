import { createContext, useState, useEffect, useRef } from "react";
import { authService } from "@/features/auth/services/authService";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rbac, setRbac] = useState(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const fetchRbac = async (userId) => {
    if (!userId) {
      setRbac(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_rbac')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setRbac(data || null);
    } catch (error) {
      console.error('Error fetching RBAC:', error);
      setRbac(null);
    }
  };

  useEffect(() => {
    // Supabase's recommended pattern: use ONLY onAuthStateChange for initialization.
    // It fires immediately with INITIAL_SESSION (or NO_SESSION) on mount.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Resolve loading as soon as we know the auth state —
      // do NOT await fetchRbac here, it can hang and block loading forever.
      if (!initializedRef.current) {
        initializedRef.current = true;
        setLoading(false);
      }

      // Fetch RBAC in the background after loading is resolved.
      if (currentUser) {
        fetchRbac(currentUser.id);
      } else {
        setRbac(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    rbac,
    loading,
    signIn: async (email, password) => {
      const data = await authService.signIn(email, password);
      // onAuthStateChange will fire and handle user/rbac state
      return data;
    },
    signOut: async () => {
      // Always clear local state, even if the Supabase call fails.
      // This ensures the user is always navigated back to login.
      try {
        await authService.signOut();
      } catch (error) {
        console.error("Sign out error (proceeding anyway):", error);
      } finally {
        setUser(null);
        setRbac(null);
      }
    },
  };

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Exported separately to avoid Vite Fast Refresh issues
export { AuthContext };
