// @ts-nocheck
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ChevronRight, Clock, Sparkles, Palette, Wand2 } from "lucide-react";
import {
  SETUP_GUIDES,
  stageProgress,
  SETUP_STAGES,
} from "@/lib/zernio-setup-guides";
import {
  listProgress,
  type ProgressRow,
} from "@/lib/social-setup.functions";
import { listAccounts } from "@/lib/zernio.functions";
import { listSelectedAssets } from "@/lib/creative.functions";
import { ASSET_TYPES } from "@/lib/creative-vibes";
import { getBrandPackage } from "@/lib/brand-intake.functions";

export default function AdminSocialSetup() {
  const pkgQ = useQuery({ queryKey: ["brand-package"], queryFn: getBrandPackage });
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
  const pkg = pkgQ.data;
  const packageApproved = pkg?.status === "approved";
  const packageDraft = !!pkg && pkg.status === "draft";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Setup wizard"
        description="An AI-guided, step-by-step walkthrough. Start with a 60-second brand intake — we draft everything every platform needs, then you create the visuals, then connect each account."
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

      {/* Step 0 — AI Brand Intake */}
      <Card className={packageApproved ? "" : "border-primary/40"}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4 text-primary" />
              Step 0 — AI Brand Intake
              {packageApproved && <Badge variant="secondary">Approved</Badge>}
              {packageDraft && <Badge variant="outline">Draft</Badge>}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Answer two short questions. AI drafts your display name, handles, every platform's bio,
              visual direction, and a launch kit. Review, edit, approve.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/admin/social/setup/intake">
              {pkg ? "Open Brand Package" : "Start AI Intake"}
            </Link>
          </Button>
        </CardHeader>
        {pkg && (
          <CardContent className="grid gap-2 text-xs sm:grid-cols-4">
            <Snippet label="Display name" value={pkg.identity?.display_name} />
            <Snippet label="Handle" value={pkg.identity?.handle_suggestions?.[0]
              ? `@${pkg.identity.handle_suggestions[0]}` : null} />
            <Snippet label="Vibe" value={pkg.visual_direction?.vibe?.replace(/_/g, " ")} />
            <Snippet label="Color mood" value={pkg.visual_direction?.color_mood} />
          </CardContent>
        )}
      </Card>

      <CreativeStudioCard packageApproved={packageApproved} />

      <div>
        <h2 className="mb-3 text-lg font-medium">Platforms</h2>
        {!packageApproved && (
          <p className="mb-3 text-xs text-muted-foreground">
            Tip: approve your Brand Package first — each platform card will then auto-populate the
            bio, handle, and launch copy for that platform.
          </p>
        )}
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

function Snippet({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded border p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate font-medium capitalize">{value || <span className="text-muted-foreground italic">—</span>}</div>
    </div>
  );
}

function CreativeStudioCard({ packageApproved }: { packageApproved: boolean }) {
  const assetsQ = useQuery({ queryKey: ["creative", "selected"], queryFn: listSelectedAssets });
  const selected = assetsQ.data ?? [];
  const doneTypes = new Set(selected.map((a) => a.asset_type));
  const doneCount = ASSET_TYPES.filter((t) => doneTypes.has(t.value)).length;
  const pct = Math.round((doneCount / ASSET_TYPES.length) * 100);

  return (
    <Card className={!packageApproved ? "opacity-75" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" />
            Step 0.5 — Creative Studio
            {!packageApproved && <Badge variant="outline">Approve Brand Package first</Badge>}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate on-brand profile marks, covers, launch posts, and a founder portrait with AI.
            Vibe and colors come from your Brand Package.
          </p>
        </div>
        <Button asChild size="sm" disabled={!packageApproved}>
          <Link to={packageApproved ? "/admin/social/setup/creative" : "/admin/social/setup/intake"}>
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
