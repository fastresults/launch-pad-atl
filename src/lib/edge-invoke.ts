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

export async function invokeEdge<T = any>(name: string, options?: InvokeOptions) {
  const extra = impersonationHeaders();
  const headers = { ...(options?.headers ?? {}), ...extra } as Record<string, string>;
  const result = await supabase.functions.invoke<T>(name, {
    ...(options ?? {}),
    ...(Object.keys(headers).length ? { headers } : {}),
  });
  if (!result.error) return result;

  // functions-js keeps a failed response body on `context` instead of parsing
  // it into `data`. Preserve the backend's specific message for every caller.
  const context = (result.error as unknown as { context?: Response }).context;
  if (context) {
    try {
      const payload = await context.clone().json() as {
        error?: unknown;
        message?: unknown;
        code?: unknown;
        providers?: unknown;
      };
      const detail = payload?.error ?? payload?.message;
      const message = typeof detail === "string"
        ? detail
        : detail && typeof detail === "object"
          ? JSON.stringify(detail)
          : null;
      if (message) {
        // Carry structured fields (capacity code, provider attribution) onto the
        // Error so callers can classify without re-reading the response body.
        const err = Object.assign(new Error(message), {
          status: context.status,
          code: payload?.code,
          providers: payload?.providers,
        });
        return { ...result, error: err };
      }
    } catch {
      // Keep the library error when a function returned a non-JSON body.
    }
  }
  return result;
}

