import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "employee" | "other" | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const initializeRoleForUser = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id);

      if (error) {
        console.error("Failed to fetch user role", error);
        setRole(null);
        return;
      }

      if (data && data.length > 0) {
        setRole(data[0].role as AppRole);
        return;
      }

      const preferredRole =
        (currentUser.user_metadata?.preferred_role === "employee"
          ? "employee"
          : "other") as AppRole;

      const { error: insertError } = await supabase.from("user_roles").insert({
        user_id: currentUser.id,
        role: preferredRole,
      });

      if (insertError) {
        console.error("Failed to insert user role", insertError);
      }

      setRole(preferredRole);
    } catch (error) {
      console.error("Unexpected error while initializing role", error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        setTimeout(() => {
          void initializeRoleForUser(currentUser);
        }, 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      const currentSession = data.session ?? null;
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        void initializeRoleForUser(currentUser);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    user,
    session,
    role,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
