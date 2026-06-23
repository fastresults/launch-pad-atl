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
import {
  AlertCircle,
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
  activeChip: string;
};

const OPTIONS: VariantOption[] = [
  {
    value: "original",
    label: "Original",
    tagline: "Paid monthly cohorts with seat tiers and a cohort picker.",
    bullets: ["Paid monthly cohorts", "Seat-tier pricing", "Cohort picker"],
    icon: Users,
    activeChip: "Original",
  },
  {
    value: "selection",
    label: "Selection — Free Cohort",
    tagline: "Inaugural Atlanta cohort. 6 selected founders. Free.",
    bullets: ["Inaugural Atlanta cohort", "6 founders, free", "July 23, 2026"],
    icon: Sparkles,
    activeChip: "Free cohort",
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
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
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
  const [saving, setSaving] = useState<string | null>(null);

  const { data, isLoading } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: () => getPublicSiteSettings(),
  });

  const onChange = async (
    key: "home_variant" | "register_variant",
    value: SiteVariant,
    label: string,
  ) => {
    setError(null);
    setSaving(key);
    try {
      await updateSiteSetting({ data: { key, value } });
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success(
        `${key === "home_variant" ? "Homepage" : "Registration"} set to ${label}`,
      );
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Save failed.";
      console.error("[admin.site] save failed", err);
      setError(friendlyError(raw));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site settings"
        description="Switch which hero variant is live on the public homepage and registration page. Changes go live instantly — no redeploy."
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
        <div className="grid gap-6 md:grid-cols-2">
          <VariantCard
            title="Homepage"
            route="/"
            current={data.home_variant}
            updatedAt={data.updated.home_variant}
            saving={saving === "home_variant"}
            onChange={(v, label) => onChange("home_variant", v, label)}
          />
          <VariantCard
            title="Registration"
            route="/register"
            current={data.register_variant}
            updatedAt={data.updated.register_variant}
            saving={saving === "register_variant"}
            onChange={(v, label) => onChange("register_variant", v, label)}
          />
        </div>
      )}
    </div>
  );
}

function VariantCard({
  title,
  route,
  current,
  updatedAt,
  saving,
  onChange,
}: {
  title: string;
  route: string;
  current: SiteVariant;
  updatedAt: string | null;
  saving: boolean;
  onChange: (v: SiteVariant, label: string) => void;
}) {
  const activeOption = OPTIONS.find((o) => o.value === current);
  const rel = relativeTime(updatedAt);

  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {route}
            </code>
          </div>
          {activeOption && (
            <Badge
              variant="secondary"
              className="bg-primary/15 text-primary hover:bg-primary/15"
            >
              <Check className="mr-1 size-3" />
              Active: {activeOption.activeChip}
            </Badge>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={route} target="_blank" rel="noreferrer">
            Preview <ExternalLink className="ml-1 size-3.5" />
          </a>
        </Button>
      </div>

      {/* Options */}
      <div className="space-y-3 p-5">
        {OPTIONS.map((opt) => {
          const active = current === opt.value;
          const isSavingThis = saving && active;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              onClick={() => !active && onChange(opt.value, opt.label)}
              aria-pressed={active}
              className={`w-full rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                active
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                  : "border-border bg-background hover:border-foreground/20 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-foreground">
                        {opt.label}
                      </span>
                      {isSavingThis && (
                        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      }`}
                    >
                      {active && <Check className="size-3" strokeWidth={3} />}
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
      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span>
          {rel ? (
            <>
              Updated <span title={new Date(updatedAt!).toLocaleString()}>{rel}</span>
            </>
          ) : (
            "Not yet saved"
          )}
        </span>
        <span>Goes live instantly</span>
      </div>
    </div>
  );
}
