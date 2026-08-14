// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Trash2, Check, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  listSocialAssets,
  generateSocialCover,
  selectSocialAsset,
  deleteSocialAsset,
  type SocialAsset,
} from "@/lib/social-cover.functions";
import {
  PLATFORM_SPECS,
  ART_DIRECTIONS,
  type ArtDirectionId,
} from "@/lib/social-platform-specs";
import { LogoPlacementMenu } from "@/components/hub/brand/LogoPlacementMenu";
import { setStudioMarkChoice } from "@/lib/brandKit.functions";
import { socialGraphicKey, studioChoiceFor } from "@/lib/brand/collateral-marks";

type BusyKey = string; // platform:asset:direction

function key(platform: string, asset: string, direction: string): BusyKey {
  return `${platform}:${asset}:${direction}`;
}

export function CoverArtTab({
  snapshotId,
  kit,
  recommendedPlatforms,
}: {
  snapshotId: string;
  kit: any;
  recommendedPlatforms: string[];
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<Record<BusyKey, boolean>>({});

  const assetsQ = useQuery({
    queryKey: ["social-cover", snapshotId],
    queryFn: () => listSocialAssets(snapshotId),
  });
  const assets: SocialAsset[] = assetsQ.data ?? [];

  const platforms = useMemo(() => {
    const wanted = recommendedPlatforms.length
      ? recommendedPlatforms
      : Object.keys(PLATFORM_SPECS);
    return wanted
      .map((p) => PLATFORM_SPECS[p] ?? null)
      .filter(Boolean) as (typeof PLATFORM_SPECS)[string][];
  }, [recommendedPlatforms]);

  const assetsFor = (platform: string, asset: string) =>
    assets.filter((a) => a.platform === platform && a.asset_kind === asset);

  const gen = useMutation({
    mutationFn: async (v: { platform: string; asset: string; direction: ArtDirectionId; markPick?: any; placementKey?: string }) => {
      const k = key(v.platform, v.asset, v.direction);
      setBusy((b) => ({ ...b, [k]: true }));
      try {
        return await generateSocialCover({ snapshotId, ...v });
      } finally {
        setBusy((b) => ({ ...b, [k]: false }));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] }),
    onError: (e: any) => toast.error(e.message || "Generation failed"),
  });

  // Remembering the pick is what makes it stick: every later run of this
  // surface reads it from the kit and places that exact artwork.
  const markChoice = useMutation({
    mutationFn: ({ assetKind, cell }: { assetKind: string; cell: any }) =>
      setStudioMarkChoice(snapshotId, assetKind, cell),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] }),
    onError: (e: any) => toast.error(e.message || "Could not save the logo choice"),
  });

  const select = useMutation({
    mutationFn: (assetId: string) => selectSocialAsset(snapshotId, assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
      toast.success("Selected");
    },
  });

  const del = useMutation({
    mutationFn: (assetId: string) => deleteSocialAsset(snapshotId, assetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] }),
  });

  const palette = kit?.palette?.colors ?? {};
  const head = kit?.typography?.heading?.family ?? "—";
  const body = kit?.typography?.body?.family ?? "—";

  return (
    <div className="space-y-4">
      {/* Brand strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/40 p-2 text-xs">
        <span className="text-muted-foreground">Locked to brand:</span>
        <div className="flex items-center gap-1">
          {Object.entries(palette).slice(0, 6).map(([k, v]: any) => (
            <span
              key={k}
              title={`${k}: ${v}`}
              className="h-4 w-4 rounded-full border border-border"
              style={{ background: v }}
            />
          ))}
        </div>
        <span className="text-muted-foreground">·</span>
        <span className="text-foreground">{head}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground">{body}</span>
      </div>

      {assetsQ.isLoading ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {platforms.map((p) => (
            <div key={p.platform} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">{p.label}</h4>
                <Badge variant="outline" className="text-[10px]">{p.assets.length} assets</Badge>
              </div>
              <div className="space-y-3">
                {p.assets.map((a) => {
                  const existing = assetsFor(p.platform, a.kind);
                  return (
                    <div key={a.kind} className="rounded-lg border border-border bg-background/30 p-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="font-medium text-foreground">{a.label}</span>
                          <span className="ml-2 text-[10px] text-muted-foreground">
                            {a.width}×{a.height}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {ART_DIRECTIONS.map((d) => {
                          const k = key(p.platform, a.kind, d.id);
                          const isBusy = !!busy[k];
                          const match = existing.find((x) => x.art_direction === d.id);
                          const placementKey = socialGraphicKey(p.platform, a.kind, d.id);
                          const pick = studioChoiceFor(kit?.studio_mark_choice, placementKey, a.kind);
                          return (
                            <div key={d.id} className="rounded-md border border-border bg-background/40 p-1.5">
                              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                <span className="font-medium text-foreground">{d.label}</span>
                                {match?.is_selected && (
                                  <Check className="h-3 w-3 text-status-success" />
                                )}
                              </div>
                              <div
                                className="relative overflow-hidden rounded border border-border bg-muted/30"
                                style={{ aspectRatio: `${a.width} / ${a.height}` }}
                              >
                                {match?.signed_url ? (
                                  <img
                                    src={match.signed_url}
                                    alt={`${p.label} ${a.label} ${d.label}`}
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : d.blurb}
                                  </div>
                                )}
                                {isBusy && match && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <div className="inline-flex items-center">
                                <Button
                                  size="sm" variant="ghost"
                                  className="h-6 rounded-r-none px-1.5 text-[10px]"
                                  disabled={isBusy}
                                  onClick={() => gen.mutate({ platform: p.platform, asset: a.kind, direction: d.id as ArtDirectionId, markPick: pick, placementKey })}
                                >
                                  {match ? <RefreshCw className="mr-0.5 h-3 w-3" /> : <Sparkles className="mr-0.5 h-3 w-3" />}
                                  {match ? "Regen" : "Generate"}
                                </Button>
                                <LogoPlacementMenu assetKind={a.kind} logos={kit?.logos} value={pick} used={match?.qa_notes?.logo_mark} disabled={isBusy} label={`${p.label} ${a.label} ${d.label}`} onChange={(cell) => markChoice.mutate({ assetKind: placementKey, cell })} />
                                </div>
                                {match && !match.is_selected && (
                                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                                    onClick={() => select.mutate(match.id)}>
                                    Use
                                  </Button>
                                )}
                                {match?.signed_url && (
                                  <a
                                    href={match.signed_url}
                                    download
                                    className="inline-flex h-6 items-center rounded px-1 text-[10px] text-muted-foreground hover:text-foreground"
                                    title="Download"
                                  >
                                    <Download className="h-3 w-3" />
                                  </a>
                                )}
                                {match && (
                                  <Button
                                    size="sm" variant="ghost"
                                    className="ml-auto h-6 w-6 p-0 text-muted-foreground hover:text-status-danger"
                                    onClick={() => del.mutate(match.id)}
                                    title="Remove"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
