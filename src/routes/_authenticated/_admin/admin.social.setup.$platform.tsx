// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Link2,
  ArrowLeft,
} from "lucide-react";
import {
  SETUP_GUIDES_BY_PLATFORM,
  SETUP_STAGES,
  stageProgress,
  type SetupStage,
} from "@/lib/zernio-setup-guides";
import {
  getBrand,
  listProgress,
  upsertProgressStage,
} from "@/lib/social-setup.functions";
import {
  listProfiles,
  listAccounts,
  getConnectUrl,
} from "@/lib/zernio.functions";
import { getBrandPackage, SETUP_PLATFORM_TO_BIO_KEY, PLATFORM_BIO_LIMITS } from "@/lib/brand-intake.functions";

export default function AdminSocialSetupPlatform() {
  const { platform = "" } = useParams();
  const guide = SETUP_GUIDES_BY_PLATFORM[platform];
  if (!guide) return <Navigate to="/admin/social/setup" replace />;

  const qc = useQueryClient();
  const brandQ = useQuery({ queryKey: ["social-setup", "brand"], queryFn: getBrand });
  const pkgQ = useQuery({ queryKey: ["brand-package"], queryFn: getBrandPackage });
  const progressQ = useQuery({ queryKey: ["social-setup", "progress"], queryFn: listProgress });
  const profilesQ = useQuery({ queryKey: ["zernio", "profiles"], queryFn: listProfiles });
  const accountsQ = useQuery({
    queryKey: ["zernio", "accounts", "all"],
    queryFn: () => listAccounts(),
  });

  const row = useMemo(
    () => (progressQ.data ?? []).find((r) => r.platform === platform),
    [progressQ.data, platform],
  );
  const liveConnected = (accountsQ.data?.accounts ?? []).some((a: any) => a.platform === platform);
  const merged = {
    account_created: row?.account_created ?? false,
    email_verified: row?.email_verified ?? false,
    profile_completed: row?.profile_completed ?? false,
    zernio_connected: (row?.zernio_connected ?? false) || liveConnected,
  };
  const pct = stageProgress(merged);

  const profiles: any[] = profilesQ.data?.profiles ?? [];
  const [profileId, setProfileId] = useState<string>("");

  const stageMut = useMutation({
    mutationFn: ({ stage, value }: { stage: SetupStage | "skipped"; value: boolean }) =>
      upsertProgressStage(platform, stage, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-setup", "progress"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const connectMut = useMutation({
    mutationFn: () => getConnectUrl(platform, profileId),
    onSuccess: (d) => {
      if (!d.authUrl) {
        toast.error("No auth URL returned");
        return;
      }
      window.open(d.authUrl, "_blank", "noopener,noreferrer");
      toast.message("Opened Zernio in a new tab. Refresh this page after authorizing.");
    },
    onError: (e: any) => {
      if (e?.code === "PAYMENT_REQUIRED") {
        toast.error(e.message, {
          duration: 10000,
          action: e.dashboardUrl
            ? {
                label: "Open Zernio billing",
                onClick: () => window.open(e.dashboardUrl, "_blank", "noopener,noreferrer"),
              }
            : undefined,
        });
        return;
      }
      toast.error(e.message);
    },
  });

  const copy = async (label: string, text?: string | null) => {
    if (!text) {
      toast.error(`No ${label} saved yet — fill it in the brand kit.`);
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const brand = brandQ.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={guide.label}
        description={guide.blurb}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/social/setup">
              <ArrowLeft className="mr-2 h-4 w-4" /> All platforms
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-2 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Your progress</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} />
          {row?.skipped && (
            <Badge variant="outline" className="mt-2">
              Marked as not relevant
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Before you start</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="ml-5 list-disc space-y-1 text-sm">
                {guide.needs.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step-by-step</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild>
                <a href={guide.signupUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open {guide.label} signup
                </a>
              </Button>
              <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed">
                {guide.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {guide.brandingUrl && (
                <a
                  href={guide.brandingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Platform's official help / branding guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>

          {guide.gotchas.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Common gotchas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="ml-5 list-disc space-y-1 text-sm">
                  {guide.gotchas.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Copy-paste pack for {guide.label}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tuned text from your AI Brand Package + brand kit. Click any chip to copy.
              </p>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <CopyChip label="Display name" value={pkgQ.data?.identity?.display_name ?? brand?.display_name} onCopy={copy} />
              <CopyChip
                label="Handle"
                value={
                  pkgQ.data?.identity?.handle_suggestions?.[0]
                    ? `@${pkgQ.data.identity.handle_suggestions[0]}`
                    : brand?.handle
                    ? `@${brand.handle}`
                    : null
                }
                onCopy={copy}
              />
              <CopyChip label="Website" value={brand?.website_url} onCopy={copy} />
              <CopyChip
                label={`${guide.label} bio${
                  SETUP_PLATFORM_TO_BIO_KEY[platform]
                    ? ` (max ${PLATFORM_BIO_LIMITS[SETUP_PLATFORM_TO_BIO_KEY[platform]]})`
                    : ""
                }`}
                value={
                  pkgQ.data?.per_platform_bios?.[SETUP_PLATFORM_TO_BIO_KEY[platform] ?? ""] ??
                  brand?.short_bio
                }
                onCopy={copy}
              />
              <CopyChip label="Long bio" value={pkgQ.data?.identity?.long_bio ?? brand?.long_bio} onCopy={copy} />
              <CopyChip label="Link-in-bio one-liner" value={pkgQ.data?.launch_kit?.link_in_bio} onCopy={copy} />
              <CopyChip
                label="Pinned-post copy"
                value={
                  ["twitter", "threads", "bluesky"].includes(platform)
                    ? pkgQ.data?.launch_kit?.pinned_post_short
                    : pkgQ.data?.launch_kit?.pinned_post_long
                }
                onCopy={copy}
              />
              <CopyChip
                label="Starter hashtags"
                value={
                  pkgQ.data?.launch_kit?.hashtags?.length
                    ? pkgQ.data.launch_kit.hashtags.map((h: string) => `#${h}`).join(" ")
                    : null
                }
                onCopy={copy}
              />
              <CopyChip label="Logo URL" value={brand?.logo_url} onCopy={copy} />
              <CopyChip label="Banner URL" value={brand?.banner_url} onCopy={copy} />
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button asChild variant="link" size="sm" className="px-0">
                  <Link to="/admin/social/setup/intake">Edit Brand Package →</Link>
                </Button>
                {!pkgQ.data && (
                  <Badge variant="outline" className="text-[10px]">
                    No Brand Package yet — run the AI intake to populate these
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mark your progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SETUP_STAGES.map((s) => {
                const checked = merged[s.key];
                return (
                  <label
                    key={s.key}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/30"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        stageMut.mutate({ stage: s.key, value: Boolean(v) })
                      }
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {s.label}
                        {checked && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{s.helper}</p>
                    </div>
                  </label>
                );
              })}
              <div className="border-t pt-3">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={row?.skipped ?? false}
                    onCheckedChange={(v) =>
                      stageMut.mutate({ stage: "skipped", value: Boolean(v) })
                    }
                  />
                  Not relevant for my startup — skip this platform
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connect to Zernio</CardTitle>
              <p className="text-xs text-muted-foreground">
                Available once you've created the account and completed the profile.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Create a Zernio profile first:{" "}
                  <Link to="/admin/social" className="text-primary hover:underline">
                    Go to Profiles
                  </Link>
                </p>
              ) : (
                <Select value={profileId} onValueChange={setProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a Zernio profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p: any) => (
                      <SelectItem key={p._id ?? p.id} value={p._id ?? p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                className="w-full"
                disabled={
                  !profileId ||
                  !merged.account_created ||
                  !merged.profile_completed ||
                  connectMut.isPending
                }
                onClick={() => connectMut.mutate()}
              >
                <Link2 className="mr-2 h-4 w-4" /> Connect {guide.label}
              </Button>
              {merged.zernio_connected && (
                <Badge variant="secondary" className="w-full justify-center py-1">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Connected via Zernio
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                placeholder="Anything you want to remember (recovery codes, support tickets, etc.)"
                defaultValue={row?.notes ?? ""}
                onBlur={(e) => {
                  // notes share the same upsert path; reuse stageMut would need
                  // a different stage column, so write directly via supabase here:
                  if (e.target.value === (row?.notes ?? "")) return;
                  saveNotes(platform, e.target.value).then(() =>
                    qc.invalidateQueries({ queryKey: ["social-setup", "progress"] }),
                  );
                }}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Saved when you click out.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { supabase } from "@/integrations/supabase/client";
import { getSessionUser } from "@/lib/effective-user";
async function saveNotes(platform: string, notes: string) {
  const uid = (await getSessionUser())?.id;
  if (!uid) return;
  await supabase
    .from("social_setup_progress")
    .upsert(
      { user_id: uid, platform, notes },
      { onConflict: "user_id,platform" },
    );
}

function CopyChip({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string | null | undefined;
  onCopy: (label: string, value?: string | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(label, value)}
      className="group flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-left text-xs hover:border-primary/50"
    >
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        <div className="truncate text-muted-foreground">
          {value || <span className="italic">not set</span>}
        </div>
      </div>
      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
    </button>
  );
}
