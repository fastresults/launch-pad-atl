import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { submitInquiry } from "@/lib/inquiries.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { SiteFooter } from "@/components/site/Footer";
import { SiteHeader } from "@/components/site/Header";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Atlanta Startup Sprint" },
      {
        name: "description",
        content:
          "Questions about the cohort, the program, or how to apply? Send us a message and we'll get back within 1 business day.",
      },
    ],
  }),
});

function ContactPage() {
  const submit = useServerFn(submitInquiry);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    website: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => submit({ data: form }),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (e: Error) => toast.error(e.message || "Could not send. Try again."),
  });

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Get in touch
          </h1>
          <p className="mt-3 text-muted-foreground">
            Questions, concerns, or just curious how the program works? Drop us a
            note — a real person will reply within 1 business day.
          </p>

          {submitted ? (
            <div className="mt-10 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
              <h2 className="mt-4 text-xl font-semibold">Message sent</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thanks{form.name ? `, ${form.name.split(/\s+/)[0]}` : ""}. We
                emailed you a confirmation and will get back to you within 1
                business day.
              </p>
            </div>
          ) : (
            <form
              className="mt-10 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: 1,
                  height: 1,
                }}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  maxLength={40}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  required
                  value={form.subject}
                  onChange={(e) => update("subject", e.target.value)}
                  minLength={3}
                  maxLength={180}
                  placeholder="What's this about?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  required
                  rows={7}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  minLength={10}
                  maxLength={4000}
                  placeholder="Tell us what's on your mind…"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
