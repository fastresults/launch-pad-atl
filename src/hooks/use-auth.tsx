import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, type AppRole, type MemberStatus } from "@/lib/auth.functions";
import {
  IMPERSONATION_TTL_MS,
  clearStoredImpersonation,
  readStoredImpersonation,
  writeStoredImpersonation,
} from "@/lib/effective-user";

type ImpersonationTarget = {
  userId: string;
  name: string;
  email: string;
  logId?: string;
  startedAt?: number;
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
  /** Gate state of the impersonated member (what they actually see). */
  targetMemberStatus: MemberStatus | null;
  targetFoundersHubAccess: boolean | null;
  /** When true, gates evaluate the member's own access instead of admin bypass. */
  viewMemberGates: boolean;
  setViewMemberGates: (v: boolean) => void;
  startImpersonation: (t: Omit<ImpersonationTarget, "logId">) => Promise<void>;
  stopImpersonation: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [actorUser, setActorUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [memberStatus, setMemberStatus] = useState<MemberStatus>("pending");
  const [approvedVia, setApprovedVia] = useState<"admin" | "payment" | null>(null);
  const [foundersHubAccess, setFoundersHubAccess] = useState(false);
  const [targetMemberStatus, setTargetMemberStatus] = useState<MemberStatus | null>(null);
  const [targetFoundersHubAccess, setTargetFoundersHubAccess] = useState<boolean | null>(null);
  const [viewMemberGates, setViewMemberGates] = useState(false);
  const [loading, setLoading] = useState(true);
  // True only once roles have been fetched successfully. A failed fetch must not
  // be read as "not an admin" — that silently drops an active impersonation.
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const [impersonation, setImpersonation] = useState<ImpersonationTarget | null>(
    () => readStoredImpersonation() as ImpersonationTarget | null,
  );

  useEffect(() => {
    let active = true;
    // Both `getSession()` and the INITIAL_SESSION event fire on boot. Without a
    // guard the account/roles/profile reads run two or three times per load.
    let loadedKey: string | null = null;
    let inFlight: Promise<void> | null = null;

    const loadAccount = async (u: User | null, force = false) => {
      const key = u?.id ?? "anon";
      if (!force && key === loadedKey) return inFlight ?? Promise.resolve();
      loadedKey = key;
      inFlight = runLoad(u);
      return inFlight;
    };

    const runLoad = async (u: User | null) => {
      if (!u) {
        if (active) {
          setRoles([]);
          setRolesLoaded(true);
          setMemberStatus("pending");
          setApprovedVia(null);
          setFoundersHubAccess(false);
          setTargetMemberStatus(null);
          setTargetFoundersHubAccess(null);
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
            setTargetMemberStatus(res.targetMemberStatus);
            setTargetFoundersHubAccess(res.targetFoundersHubAccess);
          }
          return;
        } catch (e) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          console.error("Failed to load account", e);
          loadedKey = null;
          if (active) {
            setRoles([]);
            setMemberStatus("pending");
            setApprovedVia(null);
            setFoundersHubAccess(false);
          }
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setActorUser(s?.user ?? null);
      // A token refresh must not churn the whole cache mid-impersonation —
      // that's what made "viewing as" feel unstable on long sessions.
      const isRefresh = event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION";
      setTimeout(() => {
        loadAccount(s?.user ?? null, event === "USER_UPDATED");
        if (!isRefresh) queryClient.invalidateQueries();
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
      clearStoredImpersonation();
      setImpersonation(null);
    }
  }, [impersonation, rolesLoaded, isAdmin, actorUser]);

  // Expire impersonation after the TTL rather than letting a forgotten tab
  // keep writing into a member's workspace.
  useEffect(() => {
    if (!impersonation) return;
    const startedAt = impersonation.startedAt ?? Date.now();
    const remaining = startedAt + IMPERSONATION_TTL_MS - Date.now();
    const finish = () => {
      clearStoredImpersonation();
      setImpersonation(null);
      setViewMemberGates(false);
      queryClient.clear();
    };
    if (remaining <= 0) {
      finish();
      return;
    }
    const t = setTimeout(finish, remaining);
    return () => clearTimeout(t);
  }, [impersonation, queryClient]);

  const startImpersonation: AuthState["startImpersonation"] = async (t) => {
    if (!isAdmin) throw new Error("Only admins can impersonate");
    // The audit trail is not optional: if we can't log it, we don't do it.
    const { data, error } = await supabase.rpc("start_impersonation", { _target: t.userId });
    if (error) throw new Error(`Could not start impersonation (audit log failed): ${error.message}`);
    const target: ImpersonationTarget = { ...t, logId: data as string, startedAt: Date.now() };
    writeStoredImpersonation(target);
    setImpersonation(target);
    setViewMemberGates(false);
    queryClient.clear();
  };

  const stopImpersonation: AuthState["stopImpersonation"] = async () => {
    const current = impersonation;
    clearStoredImpersonation();
    setImpersonation(null);
    setViewMemberGates(false);
    setTargetMemberStatus(null);
    setTargetFoundersHubAccess(null);
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

  const isImpersonating = !!impersonation && (isAdmin || !rolesLoaded);

  // When impersonating and "view member gates" is on, report the member's own
  // access so the admin sees exactly what the founder sees.
  const effectiveMemberStatus: MemberStatus =
    isImpersonating && viewMemberGates && targetMemberStatus ? targetMemberStatus : memberStatus;
  const effectiveHubAccess =
    isImpersonating && viewMemberGates && targetFoundersHubAccess !== null
      ? targetFoundersHubAccess
      : foundersHubAccess;
  const gatesAsMember = isImpersonating && viewMemberGates;

  const value: AuthState = {
    user: effectiveUser,
    actorUser,
    session,
    roles,
    memberStatus: effectiveMemberStatus,
    approvedVia,
    foundersHubAccess: effectiveHubAccess,
    loading,
    isAuthenticated: !!actorUser,
    isAdmin: gatesAsMember ? false : isAdmin,
    isSuperAdmin: gatesAsMember ? false : roles.includes("super_admin"),
    isApprovedMember: gatesAsMember
      ? effectiveMemberStatus === "approved"
      : isAdmin || memberStatus === "approved",
    signOut,
    isImpersonating,
    impersonationTarget: impersonation,
    targetMemberStatus,
    targetFoundersHubAccess,
    viewMemberGates,
    setViewMemberGates,
    startImpersonation,
    stopImpersonation,
  };

  async function signOut() {
    clearStoredImpersonation();
    setImpersonation(null);
    await supabase.auth.signOut();
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
