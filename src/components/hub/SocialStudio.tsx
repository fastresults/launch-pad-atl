// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Share2, Copy, ExternalLink, Calendar, Rocket, Lock, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { listSnapshotDocuments } from "@/lib/foundersHub.functions";
import { getBrandKit } from "@/lib/brandKit.functions";
import { SocialStudioGate } from "@/components/hub/social/SocialStudioGate";
import { CoverArtTab } from "@/components/hub/social/CoverArtTab";
import { ChannelSetupTab } from "@/components/hub/social/ChannelSetupTab";
import { SocialAutopilot } from "@/components/hub/social/SocialAutopilot";
import { SectionHeader } from "@/components/hub/SectionHeader";

export function SocialStudio({ snapshot }: { snapshot: any }) {
  const kitQ = useQuery({
    queryKey: ["brandKit", snapshot.id],
    queryFn: () => getBrandKit(snapshot.id),
  });
  const kit = kitQ.data;
  const locked = kit?.status === "locked";

  const docsQ = useQuery({
    queryKey: ["hub", "docs", snapshot.id],
    queryFn: () => listSnapshotDocuments({ data: { snapshotId: snapshot.id } }),
  });
  const docs = docsQ.data ?? [];
  const docOf = (t: string) => docs.find((d: any) => d.document_type === t && d.status === "complete");
  const auditDoc = docOf("social_media_audit_setup");
  const pillarsDoc = docOf("content_strategy_pillars");
  const calendarDoc = docOf("content_calendar_90day");
  const launchDoc = docOf("launch_content_kit");

  const platformMatrix = useMemo(() => parsePlatformMatrix(auditDoc?.content ?? ""), [auditDoc?.content]);
  const weeks = useMemo(() => parseWeeks(calendarDoc?.content ?? ""), [calendarDoc?.content]);
  const recommendedPlatforms = useMemo(
    () => platformMatrix.filter((p) => !/skip/i.test(p.recommendation)).map((p) => p.name),
    [platformMatrix],
  );

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };
  const hasStrategy = auditDoc || pillarsDoc || calendarDoc || launchDoc;

  const [advanced, setAdvanced] = useState(false);
  const [expanded, setExpanded] = useState(locked && !hasStrategy);

  return (
    <div className="space-y-3">
      <SectionHeader
        cat="Social Studio"
        index={1}
        done={hasStrategy ? 6 : locked ? 1 : 0}
        total={6}
        isOpen={expanded}
        onToggle={() => setExpanded((v) => !v)}
        contentId="social-studio-body"
        status={hasStrategy ? "complete" : locked ? "in_progress" : "locked"}
        icon={Share2}
        label="Social Studio"
        tagline="Channel kits, strategy & covers from your brand"
        accentVar="--status-tip"
        badges={
          !locked ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3" /> Brand-gated
            </span>
          ) : null
        }
        actions={
          locked ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdvanced((a) => !a)}
            >
              <Wand2 className="mr-1 h-3 w-3" />
              {advanced ? "Switch to guided" : "Advanced mode"}
            </Button>
          ) : null
        }
      />
      {expanded && (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">

      {!locked && <SocialStudioGate snapshot={snapshot} kit={kit} />}

      {locked && !advanced && (
        <SocialAutopilot snapshot={snapshot} kit={kit} onShowAdvanced={() => setAdvanced(true)} />
      )}

      {locked && advanced && (
        <Tabs defaultValue={hasStrategy ? "strategy" : "cover"} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="channels">Channel Setup</TabsTrigger>
            <TabsTrigger value="cover">Cover Art</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="space-y-3 pt-3">
            {!hasStrategy ? (
              <p className="text-xs text-muted-foreground">
                Generate <b>social media audit</b>, <b>content strategy</b>, and <b>calendar</b> to populate this tab.
              </p>
            ) : (
              <>
                {weeks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <Calendar className="h-3 w-3" />Calendar preview (first {Math.min(weeks.length, 4)} weeks)
                    </div>
                    <div className="grid gap-1.5 md:grid-cols-2">
                      {weeks.slice(0, 4).map((w) => (
                        <details key={w.title} className="rounded-lg border border-border bg-background/40 p-2 text-xs">
                          <summary className="cursor-pointer font-medium">{w.title}</summary>
                          <div className="mt-1.5 max-h-72 overflow-auto rounded-md border border-border bg-background/40 p-2">
                            <div className="prose prose-invert prose-sm max-w-none text-[11px] [&_table]:my-0 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/40 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top [&_p]:my-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{w.body}</ReactMarkdown>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="mt-1 h-6 text-[10px]" onClick={() => copy(w.body)}>
                            <Copy className="mr-1 h-3 w-3" />Copy week
                          </Button>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
                {launchDoc && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <Rocket className="h-3 w-3" />Launch kit
                    </div>
                    <div className="mt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => copy(launchDoc.content)}>
                        <Copy className="mr-1 h-3 w-3" />Copy full kit
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="channels" className="pt-3">
            <ChannelSetupTab
              snapshot={snapshot}
              kit={kit}
              platformMatrix={platformMatrix}
            />
          </TabsContent>

          <TabsContent value="cover" className="pt-3">
            <CoverArtTab
              snapshotId={snapshot.id}
              kit={kit}
              recommendedPlatforms={recommendedPlatforms}
            />
          </TabsContent>
        </Tabs>
      )}
      </div>
      )}
    </div>
  );
}

function dotColor(rec: string) {
  if (/yes/i.test(rec)) return "bg-status-success";
  if (/maybe/i.test(rec)) return "bg-status-warning";
  return "bg-muted-foreground/40";
}

function parsePlatformMatrix(md: string) {
  const out: { name: string; recommendation: string }[] = [];
  const platforms = ["Instagram", "TikTok", "LinkedIn", "X", "YouTube", "Facebook", "Pinterest", "Threads", "Reddit"];
  for (const p of platforms) {
    const re = new RegExp(`\\b${p}\\b[^\\n]*?\\b(Yes|Maybe|Skip)\\b`, "i");
    const m = md.match(re);
    if (m) out.push({ name: p, recommendation: m[1] });
  }
  return out;
}

function parseWeeks(md: string) {
  const out: { title: string; body: string }[] = [];
  const re = /(^|\n)(#{2,3})\s*(Week\s*\d+[^\n]*)\n([\s\S]*?)(?=\n#{2,3}\s|$)/gi;
  let m;
  while ((m = re.exec(md))) out.push({ title: m[3].trim(), body: m[4].trim() });
  return out;
}
