// Single entry point for every edge function call from the browser.
//
// When a super admin is "viewing as" a member, the Supabase session is still the
// admin's — so the server would otherwise resolve ownership to the admin and
// silently write into the wrong workspace. This wrapper attaches
// `x-impersonate-user`, which edge functions validate against the caller's admin
// role (supabase/functions/_shared/impersonation.ts) before honouring.
//
// Never call `supabase.functions.invoke` directly from feature code — use this.
import { supabase } from "@/integrations/supabase/client";
import { getImpersonationTarget } from "@/lib/effective-user";

export const IMPERSONATION_HEADER = "x-impersonate-user";

type InvokeOptions = Parameters<typeof supabase.functions.invoke>[1];

export function impersonationHeaders(): Record<string, string> {
  const target = getImpersonationTarget();
  return target ? { [IMPERSONATION_HEADER]: target.userId } : {};
}

export function invokeEdge<T = any>(name: string, options?: InvokeOptions) {
  const extra = impersonationHeaders();
  const headers = { ...(options?.headers ?? {}), ...extra } as Record<string, string>;
  return supabase.functions.invoke<T>(name, {
    ...(options ?? {}),
    ...(Object.keys(headers).length ? { headers } : {}),
  });
}
