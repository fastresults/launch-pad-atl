// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Copy,
  ExternalLink,
  Check,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PLATFORM_SPECS } from "@/lib/social-platform-specs";
import {
  listProgress,
  upsertProgressStage,
} from "@/lib/social-setup.functions";
import { listSocialAssets, type SocialAsset } from "@/lib/social-cover.functions";

type PlatformRow = { name: string; recommendation: string };

const SIGNUP_URLS: Record<string, string> = {
  Instagram: "https://www.instagram.com/accounts/emailsignup/",
  TikTok: "https://www.tiktok.com/signup",
  LinkedIn: "https://www.linkedin.com/company/setup/new/",
  X: "https://x.com/i/flow/signup",
  YouTube: "https://www.youtube.com/create_channel",
  Facebook: "https://www.facebook.com/pages/creation/",
  Pinterest: "https://www.pinterest.com/business/create/",
  Threads: "https://www.threads.net/login",
  Reddit: "https://www.reddit.com/register/",
};

const EDIT_URLS: Record<string, string> = {
  Instagram: "https://www.instagram.com/accounts/edit/",
  TikTok: "https://www.tiktok.com/setting",
  LinkedIn: "https://www.linkedin.com/in/me/edit/intro/",
  X: "https://x.com/settings/profile",
  YouTube: "https://studio.youtube.com/",
  Facebook: "https://www.facebook.com/settings",
  Pinterest: "https://www.pinterest.com/settings/",
  Threads: "https://www.threads.net/settings/profile",
  Reddit: "https://www.reddit.com/settings/profile",
};

function dotColor(rec: string) {
  if (/yes/i.test(rec)) return "bg-status-success";
  if (/maybe/i.test(rec)) return "bg-status-warning";
  return "bg-muted-foreground/40";
}

function recLabel(rec: string) {
  if (/yes/i.test(rec)) return "Recommended";
  if (/maybe/i.test(rec)) return "Worth trying";
  return "Skip for now";
}

function sanitizeHandle(s: string, max = 15) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, max);
}

function deriveHandle(snapshot: any) {
  const name = snapshot?.company_name || snapshot?.title || "yourbrand";
  return sanitizeHandle(name, 20) || "yourbrand";
}

function deriveBio(snapshot: any, kit: any, max = 160) {
  const tagline =
    kit?.voice?.tagline ||
    snapshot?.tagline ||
    snapshot?.one_liner ||
    snapshot?.summary ||
    "Helping founders move from idea to launched startup.";
  const out = String(tagline).replace(/\s+/g, " ").trim();
  return out.length > max ? out.slice(0, max - 1).trimEnd() + "…" : out;
}

export function ChannelSetupTab({
  snapshot,
  kit,
  platformMatrix,
}: {
  snapshot: any;
  kit: any;
  platformMatrix: PlatformRow[];
}) {
  const qc = useQueryClient();

  const handle = useMemo(() => deriveHandle(snapshot), [snapshot]);
  const bioShort = useMemo(() => deriveBio(snapshot, kit, 160), [snapshot, kit]);
  const bioLinkedIn = useMemo(() => deriveBio(snapshot, kit, 220), [snapshot, kit]);

  const assetsQ = useQuery({
    queryKey: ["social-cover", snapshot.id],
    queryFn: () => listSocialAssets(snapshot.id),
  });
  const assets: SocialAsset[] = assetsQ.data ?? [];

  const progressQ = useQuery({
    queryKey: ["social-setup-progress"],
    queryFn: listProgress,
  });
  const progress = progressQ.data ?? [];
  const progressOf = (p: string) => progress.find((r) => r.platform === p);

  const stageMu = useMutation({
    mutationFn: (v: { platform: string; stage: any; value: boolean }) =>
      upsertProgressStage(v.platform, v.stage, v.value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-setup-progress"] }),
  });

  const copy = (text: string, label = "Copied") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  // Order: matrix first, then any uncovered platforms
  const ordered = useMemo(() => {
    const known = new Set(platformMatrix.map((p) => p.name));
    const matrixRows = platformMatrix.filter((p) => PLATFORM_SPECS[p.name]);
    const extras = Object.keys(PLATFORM_SPECS)
      .filter((p) => !known.has(p))
      .map((p) => ({ name: p, recommendation: "Maybe" }));
    return [...matrixRows, ...extras];
  }, [platformMatrix]);

  const selectedAvatar = (platform: string) =>
    assets.find(
      (a) =>
        a.platform === platform &&
        a.asset_kind === "avatar" &&
        a.is_selected,
    ) ||
    assets.find(
      (a) => a.platform === platform && a.asset_kind === "avatar",
    );

  const selectedBanner = (platform: string) =>
    assets.find(
      (a) =>
        a.platform === platform &&
        (a.asset_kind === "banner" ||
          a.asset_kind === "header" ||
          a.asset_kind === "channel_art") &&
        a.is_selected,
    ) ||
    assets.find(
      (a) =>
        a.platform === platform &&
        (a.asset_kind === "banner" ||
          a.asset_kind === "header" ||
          a.asset_kind === "channel_art"),
    );

  return (
    <div className="space-y-3">
      {/* Brand identity strip */}
      <div className="rounded-xl border border-border bg-background/40 p-3">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Brand identity (used across channels)
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <FieldRow label="Suggested handle" value={`@${handle}`} onCopy={() => copy(handle, "Handle copied")} />
          <FieldRow label="Short bio (160)" value={bioShort} onCopy={() => copy(bioShort, "Bio copied")} multiline />
          <FieldRow label="LinkedIn tagline (220)" value={bioLinkedIn} onCopy={() => copy(bioLinkedIn, "Tagline copied")} multiline />
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <a
            href={`https://namechk.com/?q=${encodeURIComponent(handle)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            Check handle availability <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Per-platform cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {ordered.map((row) => {
          const spec = PLATFORM_SPECS[row.name];
          if (!spec) return null;
          const avatar = selectedAvatar(spec.platform);
          const banner = selectedBanner(spec.platform);
          const prog = progressOf(spec.platform);
          const signup = SIGNUP_URLS[spec.platform];
          const edit = EDIT_URLS[spec.platform];
          const skipped = /skip/i.test(row.recommendation);
          return (
            <div
              key={spec.platform}
              className={`rounded-xl border bg-background/40 p-3 ${
                skipped ? "border-border opacity-70" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColor(row.recommendation)}`} />
                  <h4 className="text-sm font-semibold">{spec.label}</h4>
                  <Badge variant="outline" className="text-[10px]">
                    {recLabel(row.recommendation)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {signup && (
                    <a
                      href={signup}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] hover:bg-muted/40"
                    >
                      Sign up <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {edit && (
                    <a
                      href={edit}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] hover:bg-muted/40"
                    >
                      Edit profile <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Asset previews */}
              <div className="mt-3 grid grid-cols-[64px_1fr] gap-3">
                <div className="space-y-1">
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-muted/40">
                    {avatar?.signed_url ? (
                      <img src={avatar.signed_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="text-center text-[9px] uppercase tracking-wide text-muted-foreground">
                    avatar
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="aspect-[4/1] overflow-hidden rounded-md border border-border bg-muted/40">
                    {banner?.signed_url ? (
                      <img src={banner.signed_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        <ImageIcon className="mr-1 h-3 w-3" /> No cover yet
                      </div>
                    )}
                  </div>
                  <div className="text-center text-[9px] uppercase tracking-wide text-muted-foreground">
                    banner / header
                  </div>
                </div>
              </div>

              {/* Asset specs */}
              <div className="mt-2 flex flex-wrap gap-1">
                {spec.assets.map((a) => (
                  <span
                    key={a.kind}
                    className="rounded border border-border bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    title={a.label}
                  >
                    {a.label}: {a.width}×{a.height}
                  </span>
                ))}
              </div>

              {/* Copy block */}
              <div className="mt-2 space-y-1">
                <CopyLine label="Handle" value={`@${handle}`} onCopy={() => copy(handle, "Handle copied")} />
                <CopyLine
                  label={spec.platform === "LinkedIn" ? "Tagline" : "Bio"}
                  value={spec.platform === "LinkedIn" ? bioLinkedIn : bioShort}
                  onCopy={() =>
                    copy(spec.platform === "LinkedIn" ? bioLinkedIn : bioShort, "Bio copied")
                  }
                />
              </div>

              {/* Progress checklist */}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-2 text-[11px]">
                <Stage
                  label="Created"
                  checked={!!prog?.account_created}
                  busy={stageMu.isPending}
                  onChange={(v) =>
                    stageMu.mutate({ platform: spec.platform, stage: "account_created", value: v })
                  }
                />
                <Stage
                  label="Profile complete"
                  checked={!!prog?.profile_completed}
                  busy={stageMu.isPending}
                  onChange={(v) =>
                    stageMu.mutate({
                      platform: spec.platform,
                      stage: "profile_completed",
                      value: v,
                    })
                  }
                />
                <Stage
                  label="Skip"
                  checked={!!prog?.skipped}
                  busy={stageMu.isPending}
                  onChange={(v) =>
                    stageMu.mutate({ platform: spec.platform, stage: "skipped", value: v })
                  }
                />
              </div>

              {!avatar && !banner && (
                <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> Generate covers in the <b>Cover Art</b> tab to populate
                  previews here.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/30 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="text-muted-foreground hover:text-foreground"
          title="Copy"
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>
      <div
        className={`mt-1 text-xs text-foreground ${
          multiline ? "whitespace-pre-wrap break-words" : "truncate"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function CopyLine({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-background/30 px-2 py-1">
      <span className="w-14 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 truncate text-[11px]">{value}</span>
      <button
        type="button"
        onClick={onCopy}
        className="text-muted-foreground hover:text-foreground"
        title="Copy"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

function Stage({
  label,
  checked,
  busy,
  onChange,
}: {
  label: string;
  checked: boolean;
  busy: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5">
      <Checkbox
        checked={checked}
        disabled={busy}
        onCheckedChange={(v) => onChange(!!v)}
      />
      <span className={checked ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      {checked && <Check className="h-3 w-3 text-status-success" />}
    </label>
  );
}
