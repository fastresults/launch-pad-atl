// @ts-nocheck
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getPublicSiteSettings,
  updateSiteSetting,
  type SiteSettings,
  type SiteVariant,
} from "@/lib/site-settings.functions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type VariantOption = {
  value: SiteVariant;
  label: string;
  tagline: string;
  bullets: string[];
  icon: React.ComponentType<{ className?: string }>;
};

const OPTIONS: VariantOption[] = [
  {
    value: "original",
    label: "Original",
    tagline: "Paid monthly cohorts with seat tiers and a cohort picker.",
    bullets: ["Paid monthly cohorts", "Seat-tier pricing", "Cohort picker"],
    icon: Users,
  },
  {
    value: "selection",
    label: "Selection — Free Cohort",
    tagline: "Inaugural Atlanta cohort. 6 selected founders. Free.",
    bullets: ["Inaugural Atlanta cohort", "6 founders, free", "July 23, 2026"],
    icon: Sparkles,
  },
];

function friendlyError(msg: string) {
  if (/row-level security/i.test(msg) || /permission/i.test(msg)) {
    return "You don't have permission to change site settings.";
  }
  return msg;
}

function relativeTime(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function AdminSitePage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<SiteVariant | null>(null);

  const { data, isLoading } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: () => getPublicSiteSettings(),
  });

  const inSync = data ? data.home_variant === data.register_variant : true;
  const active: SiteVariant | null =
    data && inSync ? data.home_variant : null;

  const applyVariant = async (value: SiteVariant) => {
    if (!data) return;
    setError(null);
    setSaving(true);
    const prevHome = data.home_variant;
    try {
      await updateSiteSetting({ data: { key: "home_variant", value } });
      try {
        await updateSiteSetting({ data: { key: "register_variant", value } });
      } catch (err2) {
        // Roll homepage back to prior value so the two never disagree.
        try {
          await updateSiteSetting({
            data: { key: "home_variant", value: prevHome },
          });
        } catch {
          /* ignore rollback failure — surfaced via primary error */
        }
        throw err2;
      }
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
      const label = OPTIONS.find((o) => o.value === value)?.label ?? value;
      toast.success(`Live hero set to ${label}`);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Save failed.";
      console.error("[admin.site] save failed", err);
      setError(friendlyError(raw));
    } finally {
      setSaving(false);
      setPending(null);
    }
  };

  const requestChange = (value: SiteVariant) => {
    if (value === active) return;
    setPending(value);
  };

  const pendingOption = pending
    ? OPTIONS.find((o) => o.value === pending)
    : null;

  const latestUpdated =
    data &&
    [data.updated.home_variant, data.updated.register_variant]
      .filter(Boolean)
      .sort()
      .slice(-1)[0];
  const rel = relativeTime(latestUpdated ?? null);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site settings"
        description="Choose which hero variant is live across the public site. One switch controls both the homepage and the registration page."
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Couldn't save change</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Live hero variant
              </h2>
              {active ? (
                <Badge
                  variant="secondary"
                  className="bg-primary/15 text-primary hover:bg-primary/15"
                >
                  <Check className="mr-1 size-3" />
                  Live: {OPTIONS.find((o) => o.value === active)?.label}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mr-1 size-3" />
                  Out of sync — pick one to fix
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href="/" target="_blank" rel="noreferrer">
                  Preview / <ExternalLink className="ml-1 size-3.5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/register" target="_blank" rel="noreferrer">
                  Preview /register <ExternalLink className="ml-1 size-3.5" />
                </a>
              </Button>
            </div>
          </div>

          {!inSync && (
            <div className="border-b border-border bg-amber-500/5 px-5 py-3 text-sm text-foreground/80">
              Homepage is currently <strong>{data.home_variant}</strong> and
              registration is <strong>{data.register_variant}</strong>. Pick an
              option below to set both pages to the same variant.
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 p-5">
            {OPTIONS.map((opt) => {
              const isActive = active === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => requestChange(opt.value)}
                  aria-pressed={isActive}
                  className={`w-full rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    isActive
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                      : "border-border bg-background hover:border-foreground/20 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-foreground">
                            {opt.label}
                          </span>
                          {isActive && (
                            <Badge
                              variant="secondary"
                              className="bg-primary/15 text-primary hover:bg-primary/15"
                            >
                              Live
                            </Badge>
                          )}
                          {saving && pending === opt.value && (
                            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        <div
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            isActive
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background"
                          }`}
                        >
                          {isActive && <Check className="size-3" strokeWidth={3} />}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-foreground/70">
                        {opt.tagline}
                      </p>
                      <ul className="mt-2.5 flex flex-wrap gap-1.5">
                        {opt.bullets.map((b) => (
                          <li
                            key={b}
                            className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>
              {rel ? (
                <>
                  Last changed{" "}
                  <span title={new Date(latestUpdated!).toLocaleString()}>
                    {rel}
                  </span>
                </>
              ) : (
                "Not yet saved"
              )}
            </span>
            <span>Applies to / and /register · goes live instantly</span>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && !saving && setPending(null)}
        title={
          pendingOption
            ? `Switch live hero to ${pendingOption.label}?`
            : "Switch live hero?"
        }
        description={
          <>
            This will update both the homepage (<code>/</code>) and the
            registration page (<code>/register</code>) immediately. Visitors will
            see the new hero on their next page load.
          </>
        }
        confirmLabel="Switch hero"
        loading={saving}
        onConfirm={() => pending && applyVariant(pending)}
      />
    </div>
  );
}
