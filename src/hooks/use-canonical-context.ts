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
import {
  getCanonicalFounderContext,
  type CanonicalFounderContext,
} from "@/lib/canonical-context";

export const CANONICAL_CONTEXT_QUERY_KEY = ["canonical-founder-context"] as const;

export function useCanonicalContext(opts?: { enabled?: boolean }) {
  return useQuery<CanonicalFounderContext | null>({
    queryKey: CANONICAL_CONTEXT_QUERY_KEY,
    queryFn: getCanonicalFounderContext,
    enabled: opts?.enabled ?? true,
    // The underlying tables don't change second-to-second; cache for 2 min.
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useInvalidateCanonicalContext() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: CANONICAL_CONTEXT_QUERY_KEY });
}
