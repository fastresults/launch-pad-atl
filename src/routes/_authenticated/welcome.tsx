import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getMyIntake, submitMyIntake } from "@/lib/member-intake.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/welcome")({
  component: WelcomePage,
  head: () => ({ meta: [{ title: "Welcome — Atlanta Startup Sprint" }] }),
});

const STARTUP_TYPES = [
  { value: "online-services", label: "Online services / agency" },
  { value: "main-street", label: "Main-street / local business" },
  { value: "tech-product", label: "Tech product / SaaS" },
  { value: "physical-product", label: "Physical product / brand" },
  { value: "creator-media", label: "Creator / media" },
  { value: "nonprofit", label: "Nonprofit / community" },
  { value: "other", label: "Something else" },
];

function WelcomePage() {
  const { user, isApprovedMember, isAdmin, signOut } = useAuth();
  const getIntake = useServerFn(getMyIntake);
  const submit = useServerFn(submitMyIntake);
  const intakeQ = useQuery({
    queryKey: ["my-intake"],
    queryFn: () => getIntake(),
    enabled: !!user,
  });

  const [startupType, setStartupType] = useState("");
  const [startupName, setStartupName] = useState("");
  const [oneLineIdea, setOneLineIdea] = useState("");
  const [supportingInfo, setSupportingInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isApprovedMember) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  if (intakeQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const existing = intakeQ.data?.intake;
  const firstName = user?.user_metadata?.display_name?.split(" ")[0] ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupType || oneLineIdea.length < 5) {
      toast.error("Tell us a bit more about your idea.");
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          startup_type: startupType as any,
          startup_name: startupName || null,
          one_line_idea: oneLineIdea,
          supporting_info: supportingInfo || null,
        },
      });
      toast.success("Got it — we'll be in touch.");
      intakeQ.refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          Atlanta Startup Sprint
        </Link>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {firstName ? `Welcome, ${firstName}.` : "Welcome."}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tell us what you're building. A member of our team will reach out to arrange your
            workshop and get your dashboard set up.
          </p>
        </div>

        {existing ? (
          <div className="space-y-6 rounded-2xl border border-white/10 bg-card p-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <div className="mt-1 text-base font-medium capitalize">
                {existing.status === "submitted"
                  ? "Submitted — we'll reach out shortly"
                  : existing.status === "contacted"
                    ? "We've reached out — check your inbox"
                    : existing.status}
              </div>
            </div>
            <ReadRow label="Startup type" value={existing.startup_type} />
            {existing.startup_name && (
              <ReadRow label="Startup name" value={existing.startup_name} />
            )}
            <ReadRow label="Your idea" value={existing.one_line_idea} />
            {existing.supporting_info && (
              <ReadRow label="Supporting info" value={existing.supporting_info} />
            )}
            <div className="border-t border-white/10 pt-6">
              <div className="text-sm text-muted-foreground">
                Want to skip the wait?{" "}
                <Link to="/register" className="text-foreground underline">
                  Register for a workshop
                </Link>{" "}
                — paying immediately unlocks your dashboard.
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-white/10 bg-card p-6"
          >
            <div className="space-y-2">
              <Label>What kind of startup are you building?</Label>
              <Select value={startupType} onValueChange={setStartupType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick the closest fit" />
                </SelectTrigger>
                <SelectContent>
                  {STARTUP_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startup_name">Startup name (optional)</Label>
              <Input
                id="startup_name"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="Working title is fine"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="one_line">Your idea, in one line</Label>
              <Input
                id="one_line"
                value={oneLineIdea}
                onChange={(e) => setOneLineIdea(e.target.value)}
                placeholder="What are you building, and for whom?"
                required
                maxLength={400}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supporting">Anything else we should know? (optional)</Label>
              <Textarea
                id="supporting"
                value={supportingInfo}
                onChange={(e) => setSupportingInfo(e.target.value)}
                placeholder="Stage, who it's for, why now, what you've tried, anything that helps."
                rows={5}
                maxLength={4000}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link to="/register" className="text-sm text-muted-foreground underline">
                Or register for a workshop directly →
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit & request workshop"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm">{value}</div>
    </div>
  );
}
