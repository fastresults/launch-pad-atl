import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, type AppRole, type MemberStatus } from "@/lib/auth.functions";

type AuthState = {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  memberStatus: MemberStatus;
  approvedVia: "admin" | "payment" | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApprovedMember: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [memberStatus, setMemberStatus] = useState<MemberStatus>("pending");
  const [approvedVia, setApprovedVia] = useState<"admin" | "payment" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadAccount = async (u: User | null) => {
      if (!u) {
        if (active) {
          setRoles([]);
          setMemberStatus("pending");
          setApprovedVia(null);
        }
        return;
      }
      try {
        const res = await getMyAccount();
        if (active) {
          setRoles(res.roles);
          setMemberStatus(res.memberStatus);
          setApprovedVia(res.approvedVia);
        }
      } catch (e) {
        console.error("Failed to load account", e);
        if (active) {
          setRoles([]);
          setMemberStatus("pending");
          setApprovedVia(null);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setTimeout(() => {
        loadAccount(s?.user ?? null);
        router.invalidate();
        queryClient.invalidateQueries();
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadAccount(data.session?.user ?? null).finally(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, queryClient]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const value: AuthState = {
    user,
    session,
    roles,
    memberStatus,
    approvedVia,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isSuperAdmin: roles.includes("super_admin"),
    isApprovedMember: isAdmin || memberStatus === "approved",
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
