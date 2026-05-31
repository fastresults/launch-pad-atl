import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { submitInquiry } from "@/lib/inquiries.functions";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/paused")({
  component: PausedPage,
  head: () => ({ meta: [{ title: "Account paused — StartupLabs" }] }),
});

function PausedPage() {
  const { user, signOut } = useAuth();
  const submit = useServerFn(submitInquiry);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    "";
  const email = user?.email ?? "";

  const [name, setName] = useState(displayName);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      toast.error("Please share a few sentences so we can help.");
      return;
    }
    setSending(true);
    try {
      await submit({
        data: {
          name: name || email,
          email,
          subject: "[Paused account] Request to review",
          message: `${message.trim()}\n\n— Sent from the paused-account screen (user_id: ${user?.id ?? "unknown"})`,
        },
      });
      setSent(true);
      setMessage("");
      toast.success("Message sent. We'll be in touch shortly.");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <StartupLabsLogo className="h-7 w-auto text-foreground" />
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-xl px-6 py-16">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Account paused
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your account is paused
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Access to your founder dashboard has been temporarily paused by the StartupLabs team.
            Your work is safe — nothing has been deleted. If this feels like a mistake or you'd
            like to discuss reinstatement, send us a note and we'll get back to you within one
            business day.
          </p>
        </div>

        <section className="mt-12 rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Request a review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We read every message personally.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              Thanks — your message is in. A team member will reply to{" "}
              <span className="font-medium text-foreground">{email}</span> soon.
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                  Send another
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="paused-name">Your name</Label>
                <Input
                  id="paused-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paused-email">Email</Label>
                <Input id="paused-email" value={email} readOnly disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paused-message">What would you like us to know?</Label>
                <Textarea
                  id="paused-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share context, questions, or anything that would help us review your account."
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                {sending ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
