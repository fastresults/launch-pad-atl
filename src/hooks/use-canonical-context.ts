// Shared TanStack Query cache for canonical founder context.
// Eliminates the F1 leak from the third audit: Hub, Workflow, Documents,
// Profile, and IntakeGatewayDialog all hit the same in-memory snapshot
// rather than each re-querying the 6 underlying tables on mount.
//
// Cache is keyed by the auth user id (handled implicitly via the supabase
// client) and is invalidated whenever a writeback (profile save, intake
// gateway submit, brief save) succeeds — call `invalidateCanonicalContext`
// from the mutation's onSuccess.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getCanonicalFounderContext,
  type CanonicalFounderContext,
} from "@/lib/canonical-context";
import { VENTURE_SOURCES_CHANGED_EVENT } from "@/lib/venture-sources";

export const CANONICAL_CONTEXT_QUERY_KEY = ["canonical-founder-context"] as const;

export function useCanonicalContext(opts?: { enabled?: boolean }) {
  const qc = useQueryClient();
  // F10: when a venture source upload / delete / re-extract fires its
  // window event, drop the cached context so prefill stays in sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => qc.invalidateQueries({ queryKey: CANONICAL_CONTEXT_QUERY_KEY });
    window.addEventListener(VENTURE_SOURCES_CHANGED_EVENT, handler);
    return () => window.removeEventListener(VENTURE_SOURCES_CHANGED_EVENT, handler);
  }, [qc]);

  return useQuery<CanonicalFounderContext | null>({
    queryKey: CANONICAL_CONTEXT_QUERY_KEY,
    queryFn: getCanonicalFounderContext,
    enabled: opts?.enabled ?? true,
    // Cache for 30s — keeps consecutive component mounts cheap but bounds
    // how long stale data can linger after a writeback that forgot to invalidate.
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useInvalidateCanonicalContext() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: CANONICAL_CONTEXT_QUERY_KEY });
}
