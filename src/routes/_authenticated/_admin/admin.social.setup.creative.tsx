// @ts-nocheck
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Sparkles, CheckCircle2, ImageIcon } from "lucide-react";
import { ASSET_TYPES, type AssetType } from "@/lib/creative-vibes";
import { listSelectedAssets, type BrandAsset } from "@/lib/creative.functions";
import { getBrand } from "@/lib/social-setup.functions";

export default function AdminSocialSetupCreative() {
  const brandQ = useQuery({ queryKey: ["social-setup", "brand"], queryFn: getBrand });
  const assetsQ = useQuery({ queryKey: ["creative", "selected"], queryFn: listSelectedAssets });

  const selectedByType = useMemo(() => {
    const map: Partial<Record<AssetType, BrandAsset>> = {};
    for (const a of assetsQ.data ?? []) {
      // Take first selected per type (avatars/portrait are shared; covers/posts may be per-platform)
      if (!map[a.asset_type as AssetType]) {
        map[a.asset_type as AssetType] = a;
      }
    }
    return map;
  }, [assetsQ.data]);

  const doneCount = ASSET_TYPES.filter((t) => selectedByType[t.value]).length;
  const pct = Math.round((doneCount / ASSET_TYPES.length) * 100);
  const brandReady = !!brandQ.data?.display_name && !!brandQ.data?.short_bio;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Creative Studio"
        description="Generate on-brand profile marks, covers, launch posts, and a founder portrait — no design skills required. We turn your brand kit into a polished image pack you can paste into every platform."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/social/setup">Back to Setup wizard</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              {doneCount} of {ASSET_TYPES.length} creative types ready
            </div>
            <span className="text-sm text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} />
        </CardContent>
      </Card>

      {!brandReady && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="text-sm">
              Fill in your <strong>Brand Kit</strong> first (display name + short bio) so we can
              build great prompts for you.
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/social/setup">Open Brand Kit</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {ASSET_TYPES.map((t) => {
          const sel = selectedByType[t.value];
          return (
            <Link
              key={t.value}
              to={`/admin/social/setup/creative/${t.value}`}
              className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">{t.emoji}</span>
                    <span className="font-medium">{t.label}</span>
                    {sel && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Ready
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {t.width}×{t.height} · Used on {t.recommendedFor.join(", ")}
                  </p>
                </div>
                {sel?.signed_url ? (
                  <img
                    src={sel.signed_url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded border object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-end text-xs text-primary">
                {sel ? "Regenerate or pick another" : "Start"}
                <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
