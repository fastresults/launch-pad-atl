import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Calendar, MapPin, LogOut } from "lucide-react";

type FooterEvent = {
  dateLabel: string;
  venueName: string;
  address: string;
  mapsUrl: string;
};

/**
 * Footer for the standalone landing page. Carries the quiet member sign-in
 * surface so returning members / staff / admins can get in without knowing
 * the /login URL. Landing-only — the full-site footer is untouched.
 */
export function LandingFooter({ event }: { event: FooterEvent }) {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          <div>
            <StartupLabsLogo className="h-9 w-auto text-foreground" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              One focused morning. You leave with a real business you can run
              on Monday. Atlanta, Georgia.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg text-foreground">The workshop</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Calendar className="mt-0.5 size-4 shrink-0" />
                <span>{event.dateLabel}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {event.venueName}
                  <br />
                  {event.address}
                </span>
              </li>
            </ul>
            <a
              href={event.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-foreground underline underline-offset-4"
            >
              Get directions <ArrowRight className="size-3.5" />
            </a>
          </div>

          <div className="md:justify-self-end md:text-left">
            <MemberSignIn />
          </div>
        </div>

        <div className="mt-12 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Startup Labs · Atlanta, GA
        </div>
      </div>
    </footer>
  );
}

function MemberSignIn() {
  const { isAuthenticated, isAdmin, isApprovedMember, user, signOut, loading } =
    useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = isAdmin
    ? "/admin"
    : isApprovedMember
      ? "/dashboard"
      : "/welcome";

  if (loading) {
    return <div className="h-10 w-44 animate-pulse rounded-full bg-muted/50" />;
  }

  if (isAuthenticated) {
    return (
      <div className="w-full max-w-xs rounded-2xl border border-border/60 bg-background/60 p-5">
        <h3 className="font-serif text-lg text-foreground">You're signed in</h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {user?.email}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button size="sm" onClick={() => navigate(destination)}>
            {isAdmin ? "Go to admin" : "Go to dashboard"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="justify-center gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Member sign in
      </button>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(result.error.message);
  };

  const handleForgot = async () => {
    if (!email) {
      toast.error("Enter your email above first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link");
  };

  return (
    <div className="w-full max-w-xs rounded-2xl border border-border/60 bg-background/60 p-5">
      <h3 className="font-serif text-lg text-foreground">Member sign in</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="footer-email" className="text-xs">
            Email
          </Label>
          <Input
            id="footer-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="footer-password" className="text-xs">
              Password
            </Label>
            <button
              type="button"
              onClick={handleForgot}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              Forgot?
            </button>
          </div>
          <Input
            id="footer-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2 w-full"
        onClick={handleGoogle}
      >
        Continue with Google
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Trouble signing in?{" "}
        <Link to="/login" className="underline underline-offset-2">
          Open the full page
        </Link>
      </p>
    </div>
  );
}
