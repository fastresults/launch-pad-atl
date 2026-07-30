import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, type AppRole, type MemberStatus } from "@/lib/auth.functions";

const IMPERSONATION_KEY = "sl.impersonation.v1";

type ImpersonationTarget = {
  userId: string;
  name: string;
  email: string;
  logId?: string;
};

type AuthState = {
  /** The effective user (target when impersonating, else the real user). Downstream reads use `user.id` transparently. */
  user: User | null;
  /** The real signed-in user (the admin), regardless of impersonation. */
  actorUser: User | null;
  session: Session | null;
  roles: AppRole[];
  memberStatus: MemberStatus;
  approvedVia: "admin" | "payment" | null;
  foundersHubAccess: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApprovedMember: boolean;
  signOut: () => Promise<void>;
  // Impersonation
  isImpersonating: boolean;
  impersonationTarget: ImpersonationTarget | null;
  startImpersonation: (t: Omit<ImpersonationTarget, "logId">) => Promise<void>;
  stopImpersonation: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function readStoredImpersonation(): ImpersonationTarget | null {
  try {
    const raw = sessionStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImpersonationTarget;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [actorUser, setActorUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [memberStatus, setMemberStatus] = useState<MemberStatus>("pending");
  const [approvedVia, setApprovedVia] = useState<"admin" | "payment" | null>(null);
  const [foundersHubAccess, setFoundersHubAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  // True only once roles have been fetched successfully. A failed fetch must not
  // be read as "not an admin" — that silently drops an active impersonation.
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const [impersonation, setImpersonation] = useState<ImpersonationTarget | null>(() =>
    readStoredImpersonation(),
  );

  useEffect(() => {
    let active = true;

    const loadAccount = async (u: User | null) => {
      if (!u) {
        if (active) {
          setRoles([]);
          setRolesLoaded(true);
          setMemberStatus("pending");
          setApprovedVia(null);
          setFoundersHubAccess(false);
        }
        return;
      }
      // One retry: a transient network blip must not look like "no roles".
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await getMyAccount();
          if (active) {
            setRoles(res.roles);
            setRolesLoaded(true);
            setMemberStatus(res.memberStatus);
            setApprovedVia(res.approvedVia);
            setFoundersHubAccess(res.foundersHubAccess);
          }
          return;
        } catch (e) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          console.error("Failed to load account", e);
          if (active) {
            setRoles([]);
            setMemberStatus("pending");
            setApprovedVia(null);
            setFoundersHubAccess(false);
          }
        }
      }
    };


    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setActorUser(s?.user ?? null);
      setTimeout(() => {
        loadAccount(s?.user ?? null);
        queryClient.invalidateQueries();
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setActorUser(data.session?.user ?? null);
      loadAccount(data.session?.user ?? null).finally(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  // Auto-clear impersonation only once we know for sure the actor isn't an admin.
  useEffect(() => {
    if (impersonation && rolesLoaded && !isAdmin && actorUser) {
      sessionStorage.removeItem(IMPERSONATION_KEY);
      setImpersonation(null);
    }
  }, [impersonation, rolesLoaded, isAdmin, actorUser]);


  const startImpersonation: AuthState["startImpersonation"] = async (t) => {
    if (!isAdmin) throw new Error("Only admins can impersonate");
    let logId: string | undefined;
    try {
      const { data, error } = await supabase.rpc("start_impersonation", { _target: t.userId });
      if (error) throw error;
      logId = data as string;
    } catch (e) {
      console.warn("start_impersonation log failed", e);
    }
    const target: ImpersonationTarget = { ...t, logId };
    sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(target));
    setImpersonation(target);
    queryClient.clear();
  };

  const stopImpersonation: AuthState["stopImpersonation"] = async () => {
    const current = impersonation;
    sessionStorage.removeItem(IMPERSONATION_KEY);
    setImpersonation(null);
    queryClient.clear();
    if (current?.logId) {
      try {
        await supabase.rpc("end_impersonation", { _id: current.logId });
      } catch (e) {
        console.warn("end_impersonation log failed", e);
      }
    }
  };

  // Effective user: swap id/email when impersonating. Downstream reads of `user.id` transparently
  // target the impersonated user. All authenticated Supabase requests still authenticate as the actor.
  const effectiveUser = useMemo<User | null>(() => {
    // While roles are still loading, keep honouring an active impersonation —
    // dropping to the actor mid-load would write into the wrong workspace.
    if (impersonation && (isAdmin || !rolesLoaded) && actorUser) {

      return {
        ...actorUser,
        id: impersonation.userId,
        email: impersonation.email || actorUser.email,
      };
    }
    return actorUser;
  }, [impersonation, isAdmin, rolesLoaded, actorUser]);

  const signOut = async () => {
    sessionStorage.removeItem(IMPERSONATION_KEY);
    setImpersonation(null);
    await supabase.auth.signOut();
  };

  const value: AuthState = {
    user: effectiveUser,
    actorUser,
    session,
    roles,
    memberStatus,
    approvedVia,
    foundersHubAccess,
    loading,
    isAuthenticated: !!actorUser,
    isAdmin,
    isSuperAdmin: roles.includes("super_admin"),
    isApprovedMember: isAdmin || memberStatus === "approved",
    signOut,
    isImpersonating: !!impersonation && (isAdmin || !rolesLoaded),
    impersonationTarget: impersonation,
    startImpersonation,
    stopImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
