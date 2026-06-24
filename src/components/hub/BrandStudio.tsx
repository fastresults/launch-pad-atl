// @ts-nocheck
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Palette, Image as ImageIcon, Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { listSnapshotDocuments, generateBrandAsset } from "@/lib/foundersHub.functions";

function extractFenced(md: string, lang?: string): string | null {
  if (!md) return null;
  const re = lang ? new RegExp("```" + lang + "\\s*([\\s\\S]*?)```", "i") : /```[\s\S]*?\n([\s\S]*?)```/;
  const m = md.match(re);
  return m ? m[1].trim() : null;
}

export function BrandStudio({ snapshot }: { snapshot: any }) {
  const docsQ = useQuery({
    queryKey: ["hub", "docs", snapshot.id],
    queryFn: () => listSnapshotDocuments({ data: { snapshotId: snapshot.id } }),
  });
  const docs = docsQ.data ?? [];
  const docOf = (t: string) => docs.find((d: any) => d.document_type === t && d.status === "complete");

  const visualDoc = docOf("visual_identity_brief");
  const voiceDoc = docOf("brand_voice_tone_guide");
  const guidelinesDoc = docOf("brand_guidelines_pdf");
  const strategyDoc = docOf("brand_strategy_framework");

  const tokens = snapshot.brand_tokens ?? (visualDoc ? safeParse(extractFenced(visualDoc.content, "json")) : null);
  const logoPrompt = visualDoc ? extractFenced(visualDoc.content) : null;

  const [assets, setAssets] = useState<any[]>([]);

  const genLogo = useMutation({
    mutationFn: () => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo", count: 4 } }),
    onSuccess: (out) => {
      const fresh = (out.assets ?? []).filter((a: any) => a.ok);
      setAssets((prev) => [...fresh, ...prev]);
      toast.success(`${fresh.length} logo concepts generated`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const genProfile = useMutation({
    mutationFn: () => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "social_profile", count: 2 } }),
    onSuccess: (out) => {
      const fresh = (out.assets ?? []).filter((a: any) => a.ok);
      setAssets((prev) => [...fresh, ...prev]);
      toast.success(`${fresh.length} profile assets generated`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const exportGuidelines = () => {
    if (!guidelinesDoc) return;
    const blob = new Blob([guidelinesDoc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${snapshot.company_name || "brand"}-guidelines.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (!strategyDoc && !visualDoc && !voiceDoc) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><Palette className="h-4 w-4" />Brand Studio</div>
        <p className="mt-1">Generate <b>brand strategy</b>, <b>visual identity</b> and <b>voice & tone</b> documents to unlock asset generation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-card p-4">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Brand Studio</h3>
      </div>

      {tokens && (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Palette</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {Object.entries(tokens.colors ?? {}).map(([role, hex]: any) => (
                <div key={role} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-background/40 px-2 py-1 text-[10px]">
                  <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: hex }} />
                  <span className="font-mono">{hex}</span>
                  <span className="text-muted-foreground">{role}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Typography</div>
            <div className="mt-1 text-xs">
              <div className="font-semibold">{tokens.fonts?.heading ?? "—"}</div>
              <div className="text-muted-foreground">{tokens.fonts?.body ?? "—"}</div>
            </div>
            {Array.isArray(tokens.mood) && tokens.mood.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {tokens.mood.map((m: string) => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
        <Button size="sm" variant="outline" onClick={() => genLogo.mutate()} disabled={genLogo.isPending || !visualDoc}>
          {genLogo.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1 h-3 w-3" />}
          Generate 4 logo concepts
        </Button>
        <Button size="sm" variant="outline" onClick={() => genProfile.mutate()} disabled={genProfile.isPending || !visualDoc}>
          {genProfile.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1 h-3 w-3" />}
          Social profile pack
        </Button>
        {logoPrompt && (
          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(logoPrompt); toast.success("Logo prompt copied"); }}>
            <Copy className="mr-1 h-3 w-3" />Copy logo prompt
          </Button>
        )}
        {guidelinesDoc && (
          <Button size="sm" variant="ghost" onClick={exportGuidelines}>
            <Download className="mr-1 h-3 w-3" />Export guidelines
          </Button>
        )}
      </div>

      {assets.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {assets.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border border-white/10 bg-background/40">
              {a.url ? (
                <img src={a.url} className="aspect-square w-full object-cover transition group-hover:opacity-90" />
              ) : <div className="aspect-square w-full p-3 text-[10px] text-red-400">{a.error}</div>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function safeParse(s: string | null) {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
