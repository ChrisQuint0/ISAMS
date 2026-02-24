import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/features/auth/services/authService";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rbac, setRbac] = useState(null);
  const [loading, setLoading] = useState(true);

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
    // Check active sessions and sets the user
    authService.getSession()
      .then(async (session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchRbac(currentUser.id);
        } else {
          setRbac(null);
        }
      })
      .catch((error) => {
        console.error("Session error:", error);
        setUser(null);
        setRbac(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchRbac(currentUser.id);
        } else {
          setRbac(null);
        }
      } catch (error) {
        console.error("Auth state error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    rbac,
    loading,
    signIn: async (email, password) => {
      const data = await authService.signIn(email, password);
      // RBAC will be fetched by onAuthStateChange listener
      return data;
    },
    signOut: async () => {
      await authService.signOut();
      setUser(null);
      setRbac(null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Remove useAuth from here as it breaks Vite Fast Refresh
// It should be exported from hooks/useAuth.jsx instead
export { AuthContext };
