import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  slug: string;
  /** Which product the visitor is asking about. */
  format?: "workshop" | "course";
  label?: string;
  doneMessage?: string;
  /** "dark" sits on the navy surface; "card" sits inside a bordered card. */
  tone?: "dark" | "card";
};

/**
 * One email capture, reused by the gateway sheet and the course card. Writes to
 * workshop_waitlist with the format so we know which product they want.
 */
export function WaitlistForm({
  slug,
  format = "workshop",
  label = "Notify me",
  doneMessage = "You're on the list.",
  tone = "dark",
}: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      setState("error");
      return;
    }
    setState("saving");
    const { error } = await supabase.from("workshop_waitlist").insert({
      email: email.trim().toLowerCase(),
      workshop_slug: slug,
      format,
    });
    setState(error ? "error" : "done");
  };

  if (state === "done") {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="size-4 text-primary" aria-hidden="true" />
        {doneMessage}
      </p>
    );
  }

  const inputClass =
    tone === "card"
      ? "min-w-0 flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none aria-[invalid]:border-destructive"
      : "min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none aria-[invalid]:border-destructive";

  const buttonClass =
    tone === "card"
      ? "inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      : "inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10";

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "error") setState("idle");
        }}
        placeholder="you@email.com"
        aria-label="Email for workshop waitlist"
        aria-invalid={state === "error" || undefined}
        className={inputClass}
      />
      <button type="submit" disabled={state === "saving"} className={buttonClass}>
        {state === "saving" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          label
        )}
      </button>
    </form>
  );
}
