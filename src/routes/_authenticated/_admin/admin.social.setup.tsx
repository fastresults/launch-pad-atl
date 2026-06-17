// @ts-nocheck
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Circle, ChevronRight, Clock, Sparkles, Palette } from "lucide-react";
import {
  SETUP_GUIDES,
  stageProgress,
  SETUP_STAGES,
} from "@/lib/zernio-setup-guides";
import {
  getBrand,
  upsertBrand,
  listProgress,
  type BrandKit,
  type ProgressRow,
} from "@/lib/social-setup.functions";
import { listAccounts } from "@/lib/zernio.functions";
import { listSelectedAssets } from "@/lib/creative.functions";
import { ASSET_TYPES } from "@/lib/creative-vibes";

export default function AdminSocialSetup() {
  const qc = useQueryClient();
  const brandQ = useQuery({ queryKey: ["social-setup", "brand"], queryFn: getBrand });
  const progressQ = useQuery({ queryKey: ["social-setup", "progress"], queryFn: listProgress });
  const accountsQ = useQuery({
    queryKey: ["zernio", "accounts", "all"],
    queryFn: () => listAccounts(),
  });

  const progressByPlatform = useMemo(() => {
    const map: Record<string, ProgressRow> = {};
    for (const row of progressQ.data ?? []) map[row.platform] = row;
    return map;
  }, [progressQ.data]);

  const connectedPlatforms = useMemo(() => {
    const accounts = accountsQ.data?.accounts ?? [];
    return new Set(accounts.map((a: any) => a.platform));
  }, [accountsQ.data]);

  const readyCount = SETUP_GUIDES.filter((g) => {
    const p = progressByPlatform[g.platform];
    if (p?.skipped) return true;
    return (p?.zernio_connected || connectedPlatforms.has(g.platform));
  }).length;

  const overallPct = Math.round((readyCount / SETUP_GUIDES.length) * 100);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Setup wizard"
        description="A guided, step-by-step walkthrough for creating each social media account from scratch and connecting it to Zernio."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/social">Back to Social</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              {readyCount} of {SETUP_GUIDES.length} platforms ready
            </div>
            <span className="text-sm text-muted-foreground">{overallPct}%</span>
          </div>
          <Progress value={overallPct} />
        </CardContent>
      </Card>

      <BrandSection brand={brandQ.data} onSaved={() => qc.invalidateQueries({ queryKey: ["social-setup", "brand"] })} />

      <CreativeStudioCard />

      <div>
        <h2 className="mb-3 text-lg font-medium">Platforms</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SETUP_GUIDES.map((g) => {
            const p = progressByPlatform[g.platform];
            const liveConnected = connectedPlatforms.has(g.platform);
            const merged = {
              account_created: p?.account_created ?? false,
              email_verified: p?.email_verified ?? false,
              profile_completed: p?.profile_completed ?? false,
              zernio_connected: p?.zernio_connected || liveConnected,
            };
            const pct = stageProgress(merged);
            const skipped = p?.skipped;
            return (
              <Link
                key={g.platform}
                to={`/admin/social/setup/${g.platform}`}
                className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{g.label}</span>
                      {skipped && <Badge variant="outline" className="text-[10px]">Skipped</Badge>}
                      {merged.zernio_connected && (
                        <Badge variant="secondary" className="text-[10px]">Connected</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{g.blurb}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="space-y-2">
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> ~{g.estMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      {SETUP_STAGES.map((s) => {
                        const done = merged[s.key as keyof typeof merged];
                        return done ? (
                          <CheckCircle2 key={s.key} className="h-3 w-3 text-primary" />
                        ) : (
                          <Circle key={s.key} className="h-3 w-3" />
                        );
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BrandSection({
  brand,
  onSaved,
}: {
  brand: BrandKit | null | undefined;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<BrandKit>>(brand ?? {});

  // sync when query loads
  useMemoSyncBrand(brand, setForm);

  const saveMut = useMutation({
    mutationFn: () => upsertBrand(form),
    onSuccess: () => {
      toast.success("Brand kit saved");
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Step 0 — Your brand kit</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill this in once. Every platform card will give you copy-and-paste buttons for these
          fields so you don't have to retype anything.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <Field label="Display name" hint="e.g. StartupLabs">
          <Input
            value={form.display_name ?? ""}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          />
        </Field>
        <Field label="Handle" hint="lowercase, no spaces — try to keep it consistent across platforms">
          <Input
            value={form.handle ?? ""}
            onChange={(e) => setForm({ ...form, handle: e.target.value.replace(/^@/, "") })}
            placeholder="startuplabs"
          />
        </Field>
        <Field label="Website URL">
          <Input
            value={form.website_url ?? ""}
            onChange={(e) => setForm({ ...form, website_url: e.target.value })}
            placeholder="https://startuplabs.online"
          />
        </Field>
        <Field label="Logo URL" hint="Square, 400x400 or larger. Use the media library if you need to upload one.">
          <Input
            value={form.logo_url ?? ""}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://…/logo.png"
          />
        </Field>
        <Field label="Banner URL" hint="Wide, ~1500x500. Optional but most platforms support it.">
          <Input
            value={form.banner_url ?? ""}
            onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
            placeholder="https://…/banner.jpg"
          />
        </Field>
        <Field label="Short bio (160 chars)" className="md:col-span-1">
          <Textarea
            rows={3}
            maxLength={160}
            value={form.short_bio ?? ""}
            onChange={(e) => setForm({ ...form, short_bio: e.target.value })}
          />
        </Field>
        <Field label="Long bio (LinkedIn, About pages)" className="md:col-span-2">
          <Textarea
            rows={4}
            value={form.long_bio ?? ""}
            onChange={(e) => setForm({ ...form, long_bio: e.target.value })}
          />
        </Field>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving…" : "Save brand kit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// keep form synced after async brand load
import { useEffect } from "react";
function useMemoSyncBrand(
  brand: BrandKit | null | undefined,
  setForm: (b: Partial<BrandKit>) => void,
) {
  useEffect(() => {
    if (brand) setForm(brand);
  }, [brand]); // eslint-disable-line react-hooks/exhaustive-deps
}

function CreativeStudioCard() {
  const assetsQ = useQuery({ queryKey: ["creative", "selected"], queryFn: listSelectedAssets });
  const selected = assetsQ.data ?? [];
  const doneTypes = new Set(selected.map((a) => a.asset_type));
  const doneCount = ASSET_TYPES.filter((t) => doneTypes.has(t.value)).length;
  const pct = Math.round((doneCount / ASSET_TYPES.length) * 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" />
            Step 0.5 — Creative Studio
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate on-brand profile marks, covers, launch posts, and a founder portrait with AI.
            No design skills needed.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/social/setup/creative">
            {doneCount > 0 ? "Open Creative Studio" : "Start Creative Studio"}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {doneCount} of {ASSET_TYPES.length} creative types ready
          </span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
        <div className="grid gap-2 sm:grid-cols-4">
          {ASSET_TYPES.map((t) => {
            const asset = selected.find((a) => a.asset_type === t.value);
            return (
              <div
                key={t.value}
                className="flex items-center gap-2 rounded border p-2 text-xs"
              >
                {asset?.signed_url ? (
                  <img
                    src={asset.signed_url}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-base">
                    {t.emoji}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {asset ? "Ready" : "Not generated"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
