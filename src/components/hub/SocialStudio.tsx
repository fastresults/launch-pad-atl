// @ts-nocheck
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, ExternalLink, Calendar, Rocket } from "lucide-react";
import { toast } from "sonner";
import { listSnapshotDocuments } from "@/lib/foundersHub.functions";

export function SocialStudio({ snapshot }: { snapshot: any }) {
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

  if (!auditDoc && !pillarsDoc && !calendarDoc && !launchDoc) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><Share2 className="h-4 w-4" />Social Studio</div>
        <p className="mt-1">Generate <b>social media audit</b>, <b>content strategy</b>, and <b>calendar</b> to activate this panel.</p>
      </div>
    );
  }


  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-sky-400" />
        <h3 className="text-sm font-semibold">Social Studio</h3>
      </div>

      {platformMatrix.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Platform fit</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {platformMatrix.map((p) => (
              <a
                key={p.name}
                href={`https://namechk.com/?q=${encodeURIComponent((snapshot.company_name || "").replace(/\s+/g, ""))}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background/40 px-2 py-0.5 text-[11px] hover:bg-white/5"
              >
                <Badge variant="outline" className={`text-[9px] ${recColor(p.recommendation)}`}>{p.recommendation}</Badge>
                <span>{p.name}</span>
                <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}

      {weeks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-3 w-3" />Calendar preview (first {Math.min(weeks.length, 4)} week{weeks.length === 1 ? "" : "s"} drafted)
          </div>
          <div className="grid gap-1.5 md:grid-cols-2">
            {weeks.slice(0, 4).map((w) => (
              <details key={w.title} className="rounded-lg border border-white/10 bg-background/40 p-2 text-xs">
                <summary className="cursor-pointer font-medium">{w.title}</summary>
                <pre className="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">{w.body}</pre>
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
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => copy(launchDoc.content)}>
              <Copy className="mr-1 h-3 w-3" />Copy full kit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function recColor(rec: string) {
  if (/yes/i.test(rec)) return "border-emerald-500/40 text-emerald-300";
  if (/maybe/i.test(rec)) return "border-amber-500/40 text-amber-300";
  return "border-white/10 text-muted-foreground";
}

// Very loose markdown parser — pulls "| Platform | Yes/Maybe/Skip | ..." style tables.
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

// Pull "## Week 1", "### Week 1" etc up to the next H2/H3.
function parseWeeks(md: string) {
  const out: { title: string; body: string }[] = [];
  const re = /(^|\n)(#{2,3})\s*(Week\s*\d+[^\n]*)\n([\s\S]*?)(?=\n#{2,3}\s|$)/gi;
  let m;
  while ((m = re.exec(md))) out.push({ title: m[3].trim(), body: m[4].trim() });
  return out;
}
