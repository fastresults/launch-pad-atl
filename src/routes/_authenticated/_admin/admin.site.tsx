import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getPublicSiteSettings,
  updateSiteSetting,
  type SiteSettings,
  type SiteVariant,
} from "@/lib/site-settings.functions";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/site")({
  component: AdminSitePage,
  head: () => ({ meta: [{ title: "Site variants" }] }),
});

function AdminSitePage() {
  const getFn = useServerFn(getPublicSiteSettings);
  const setFn = useServerFn(updateSiteSetting);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const { data, isLoading } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: () => getFn(),
  });

  const onChange = async (key: "home_variant" | "register_variant", value: SiteVariant) => {
    setError(null);
    setSaving(key);
    try {
      await setFn({ data: { key, value } });
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Site settings"
        description="Edit public site copy, CTAs, contact details, and SEO metadata. Changes go live instantly — no redeploy."
      />

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
          {error}
        </div>
      )}

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <VariantCard
            title="Homepage (/)"
            current={data.home_variant}
            updatedAt={data.updated.home_variant}
            saving={saving === "home_variant"}
            previewUrl="/"
            onChange={(v) => onChange("home_variant", v)}
          />
          <VariantCard
            title="Registration (/register)"
            current={data.register_variant}
            updatedAt={data.updated.register_variant}
            saving={saving === "register_variant"}
            previewUrl="/register"
            onChange={(v) => onChange("register_variant", v)}
          />
        </div>
      )}
    </div>
  );
}

function VariantCard({
  title,
  current,
  updatedAt,
  saving,
  previewUrl,
  onChange,
}: {
  title: string;
  current: SiteVariant;
  updatedAt: string | null;
  saving: boolean;
  previewUrl: string;
  onChange: (v: SiteVariant) => void;
}) {
  const options: Array<{ value: SiteVariant; label: string; desc: string }> = [
    {
      value: "original",
      label: "Original",
      desc: "Paid monthly cohorts with seat tiers and cohort picker.",
    },
    {
      value: "selection",
      label: "Selection — Free Cohort",
      desc: "Inaugural Atlanta cohort. 6 selected founders. Free. July 23, 2026.",
    },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {updatedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/5"
        >
          Preview <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="mt-5 space-y-3">
        {options.map((opt) => {
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              onClick={() => onChange(opt.value)}
              className={`w-full text-left rounded-xl border p-4 transition ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-white/10 hover:border-white/20"
              } disabled:opacity-60`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{opt.label}</div>
                <div
                  className={`flex size-4 items-center justify-center rounded-full border ${
                    active ? "border-primary bg-primary" : "border-white/30"
                  }`}
                >
                  {active && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {saving && <p className="mt-3 text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}
