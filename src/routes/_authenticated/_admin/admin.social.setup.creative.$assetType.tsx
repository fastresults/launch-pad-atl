// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft,
  Sparkles,
  Check,
  Loader2,
  Trash2,
  Download,
  Copy,
  ImageIcon,
} from "lucide-react";
import {
  ASSET_TYPES_BY_VALUE,
  VIBES,
  COLOR_MOODS,
  type AssetType,
} from "@/lib/creative-vibes";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  generateVariations,
  selectVariation,
  deleteAsset,
  listBrandAssets,
  type BrandAsset,
} from "@/lib/creative.functions";
import { getBrand, upsertBrand } from "@/lib/social-setup.functions";

export default function AdminSocialSetupCreativeAsset() {
  const { assetType = "" } = useParams();
  const def = ASSET_TYPES_BY_VALUE[assetType as AssetType];
  if (!def) return <Navigate to="/admin/social/setup/creative" replace />;

  const qc = useQueryClient();
  const brandQ = useQuery({ queryKey: ["social-setup", "brand"], queryFn: getBrand });
  const assetsQ = useQuery({ queryKey: ["creative", "all"], queryFn: listBrandAssets });

  const ofType = useMemo(
    () => (assetsQ.data ?? []).filter((a) => a.asset_type === assetType),
    [assetsQ.data, assetType],
  );

  const [vibe, setVibe] = useState<string>(brandQ.data?.vibe ?? "");
  const [colorMood, setColorMood] = useState<string>(brandQ.data?.color_mood ?? "");
  const [subject, setSubject] = useState<string>("");

  // sync defaults when brand loads
  useMemoSync(brandQ.data, (b) => {
    if (b?.vibe && !vibe) setVibe(b.vibe);
    if (b?.color_mood && !colorMood) setColorMood(b.color_mood);
    if (!subject && (b?.display_name || b?.short_bio)) {
      setSubject(
        [b.display_name, b.short_bio].filter(Boolean).join(" — "),
      );
    }
  });

  const genMut = useMutation({
    mutationFn: () =>
      generateVariations({
        assetType: assetType as AssetType,
        vibe,
        colorMood,
        subject,
        brandName: brandQ.data?.display_name ?? undefined,
        width: def.width,
        height: def.height,
        count: 3,
      }),
    onSuccess: async (data) => {
      // persist vibe/colorMood on brand for next time
      if (brandQ.data) {
        await upsertBrand({ vibe, color_mood: colorMood }).catch(() => {});
      }
      qc.invalidateQueries({ queryKey: ["creative"] });
      qc.invalidateQueries({ queryKey: ["social-setup", "brand"] });
      if (data.partial_error) toast.warning(`Generated with partial errors: ${data.partial_error}`);
      else toast.success(`Generated ${data.variations.length} variations`);
    },
    onError: (e: any) => {
      if (e.code === "PAYMENT_REQUIRED") {
        toast.error("AI credits exhausted. Add credits in Workspace → Usage.");
      } else if (e.code === "RATE_LIMITED") {
        toast.error("Rate limited — wait a moment and try again.");
      } else {
        toast.error(e.message ?? "Generation failed");
      }
    },
  });

  const selectMut = useMutation({
    mutationFn: (id: string) => selectVariation(id, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creative"] });
      toast.success("Selected as your brand creative");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creative"] });
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const steps = [
    { key: "vibe", label: "Pick a vibe", done: !!vibe },
    { key: "color", label: "Pick a color mood", done: !!colorMood },
    { key: "subject", label: "Confirm subject", done: subject.trim().length > 5 },
    { key: "generate", label: "Generate & choose", done: ofType.some((a) => a.is_selected) },
  ];
  const doneSteps = steps.filter((s) => s.done).length;
  const pct = Math.round((doneSteps / steps.length) * 100);
  const canGenerate = !!vibe && !!colorMood && subject.trim().length > 5;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={def.label}
        description={`${def.description} · ${def.width}×${def.height} · Recommended for ${def.recommendedFor.join(", ")}`}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/social/setup/creative">
              <ArrowLeft className="mr-1 h-4 w-4" /> All creative
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Step {doneSteps} of {steps.length}: {steps.find((s) => !s.done)?.label ?? "Done"}
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Pick a vibe</CardTitle>
          <p className="text-sm text-muted-foreground">
            How should it feel? Pick the chip closest to your startup's personality.
          </p>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          {VIBES.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setVibe(v.value)}
              className={`rounded-lg border p-3 text-left transition ${
                vibe === v.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/40"
              }`}
            >
              <div className="mb-2 flex h-6 overflow-hidden rounded">
                {v.swatch.map((c) => (
                  <div key={c} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                {v.label}
                {vibe === v.value && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{v.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Pick a color mood</CardTitle>
          <p className="text-sm text-muted-foreground">Sets the overall palette.</p>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-5">
          {COLOR_MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setColorMood(m.value)}
              className={`rounded-lg border p-3 text-left transition ${
                colorMood === m.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/40"
              }`}
            >
              <div className="mb-2 flex h-6 overflow-hidden rounded">
                {m.swatch.map((c) => (
                  <div key={c} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                {m.label}
                {colorMood === m.value && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Confirm subject</CardTitle>
          <p className="text-sm text-muted-foreground">
            What should the image be about? We pre-filled this from your Brand Kit — tweak if you
            want.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. StartupLabs — accelerator for first-time founders building B2B tools"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Generate</CardTitle>
          <p className="text-sm text-muted-foreground">
            We'll create 3 variations. Pick your favorite, or regenerate if none fit.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Each generation uses AI credits from your workspace.
            </div>
            <Button onClick={() => genMut.mutate()} disabled={!canGenerate || genMut.isPending}>
              {genMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating 3 variations…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {ofType.length ? "Generate 3 more" : "Generate"}
                </>
              )}
            </Button>
          </div>

          {genMut.isPending && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-square w-full animate-pulse rounded border bg-muted"
                />
              ))}
            </div>
          )}

          {ofType.length === 0 && !genMut.isPending && (
            <div className="flex flex-col items-center justify-center gap-2 rounded border border-dashed p-8 text-sm text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
              No variations yet. Pick vibe + color + subject above, then Generate.
            </div>
          )}

          {ofType.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {ofType.map((a) => (
                <VariationCard
                  key={a.id}
                  asset={a}
                  onSelect={() => selectMut.mutate(a.id)}
                  onDelete={() => deleteMut.mutate(a.id)}
                  busy={selectMut.isPending || deleteMut.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VariationCard({
  asset,
  onSelect,
  onDelete,
  busy,
}: {
  asset: BrandAsset;
  onSelect: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const confirm = useConfirm();
  return (
    <div
      className={`overflow-hidden rounded border ${
        asset.is_selected ? "border-primary ring-2 ring-primary/30" : ""
      }`}
    >
      <div className="relative aspect-square bg-muted">
        {asset.signed_url ? (
          <img src={asset.signed_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
        {asset.is_selected && (
          <Badge className="absolute left-2 top-2 gap-1">
            <Check className="h-3 w-3" /> Selected
          </Badge>
        )}
      </div>
      <div className="space-y-2 p-2">
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={asset.is_selected ? "secondary" : "default"}
            className="flex-1"
            disabled={busy || asset.is_selected}
            onClick={onSelect}
          >
            {asset.is_selected ? "Selected" : "Use this one"}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (asset.signed_url) {
                navigator.clipboard.writeText(asset.signed_url);
                toast.success("URL copied");
              }
            }}
            title="Copy URL"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            asChild
            title="Download"
          >
            <a href={asset.signed_url ?? "#"} download target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              if (await confirm({ title: "Delete this variation?", destructive: true, confirmText: "Delete" })) onDelete();
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// sync hook
import { useEffect } from "react";
function useMemoSync<T>(value: T, fn: (v: T) => void) {
  useEffect(() => {
    fn(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}
