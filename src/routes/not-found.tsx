import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const RECOVER_KEY = "startuplabs:route-recover";

/**
 * Unknown route. Previously this silently redirected to "/", which made a
 * stale JS bundle (route added after the tab booted) look like "the admin link
 * sends me to the homepage". Now we attempt exactly one hard reload to pick up
 * the latest bundle, then show a real 404.
 */
export default function NotFoundPage() {
  const location = useLocation();
  const [recovering, setRecovering] = useState(true);

  useEffect(() => {
    const key = `${RECOVER_KEY}:${location.pathname}`;
    if (sessionStorage.getItem(key)) {
      setRecovering(false);
      return;
    }
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }, [location.pathname]);

  if (recovering) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          Nothing is routed at <code className="rounded bg-muted px-1">{location.pathname}</code>.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
