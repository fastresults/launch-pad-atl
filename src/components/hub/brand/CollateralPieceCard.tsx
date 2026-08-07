// @ts-nocheck
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Eye, Loader2, Plus, Sparkles } from "lucide-react";

/**
 * One deliverable in the collateral library. Uniform height, artwork-first —
 * the piece is the product, so it gets the space.
 */
export function CollateralPieceCard({
  label,
  note,
  preview,
  fileCount,
  stale,
  qc,
  busy,
  canGenerate,
  disabled,
  onPreview,
  onGenerate,
}: {
  label: string;
  note: string;
  preview: string | null;
  fileCount: number;
  stale: boolean;
  qc: { ok: boolean; reasons: string[] } | null;
  busy: boolean;
  canGenerate: boolean;
  disabled: boolean;
  onPreview: () => void;
  onGenerate: () => void;
}) {
  const generated = fileCount > 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-background/40 transition hover:border-white/20">
      <button
        type="button"
        onClick={generated ? onPreview : onGenerate}
        disabled={!generated && disabled}
        aria-label={generated ? `Preview ${label}` : `Generate ${label}`}
        className={`group relative block aspect-[16/10] w-full overflow-hidden border-b border-white/10 disabled:cursor-not-allowed ${preview ? "bg-white" : "bg-background/60"}`}
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full rounded-lg object-contain p-2 transition group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted/10">
            <span className="flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/40 px-3 py-1.5 text-[11px] text-muted-foreground">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {busy ? "Generating…" : "Not generated"}
            </span>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="text-sm font-medium leading-tight">{label}</div>
        <p className="text-[11px] leading-snug text-muted-foreground">{note}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          {generated && <Badge variant="secondary" className="text-[10px]">{fileCount} file{fileCount === 1 ? "" : "s"}</Badge>}
          {qc?.ok && (
            <Badge variant="outline" className="gap-1 border-status-success/40 text-[10px] text-status-success">
              <CheckCircle2 className="h-3 w-3" />Print-checked
            </Badge>
          )}
          {stale && (
            <Badge variant="outline" className="border-status-warning/50 text-[10px] text-status-warning">Details changed</Badge>
          )}
        </div>

        {qc?.ok === false && (
          <p className="text-[11px] leading-snug text-status-warning">{qc.reasons[0]}</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 px-2 text-[11px]"
            onClick={onPreview}
            disabled={!generated}
          >
            <Eye className="mr-1 h-3 w-3" />Preview
          </Button>
          <Button
            size="sm"
            variant={generated ? "ghost" : "secondary"}
            className="h-7 px-2 text-[11px]"
            disabled={disabled || !canGenerate}
            onClick={onGenerate}
          >
            {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {generated ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
