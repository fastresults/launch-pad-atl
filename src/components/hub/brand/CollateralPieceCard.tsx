// @ts-nocheck
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, ChevronDown, Eye, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { LOGO_SLOTS } from "@/components/hub/brand/LogoSetPanel";

const AUTO = "auto";
const toKey = (c: { form: string; tone: string } | null | undefined) =>
  c ? `${c.form}|${c.tone}` : AUTO;

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
  markChoice,
  markUsed,
  availableSlots,
  onMarkChoice,
  onPreview,
  onGenerate,
  onDelete,
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
  /** The founder's chosen form × tone for this piece, or null for automatic. */
  markChoice?: { form: string; tone: string } | null;
  /** What the last run actually drew, so the card can say which mark it carries. */
  markUsed?: { form: string; tone: string; fallback?: boolean } | null;
  /** Slot keys the venture has actually supplied — everything else reads as absent. */
  availableSlots?: Record<string, boolean>;
  onMarkChoice?: (choice: { form: string; tone: string } | null) => void;
  onPreview: () => void;
  onGenerate: () => void;
  /** Remove every file for this piece. Only offered once something exists. */
  onDelete: () => void;
}) {
  const generated = fileCount > 0;
  const supplied = availableSlots ?? {};
  const slotLabel = (c?: { form: string; tone: string } | null) =>
    LOGO_SLOTS.find((s) => s.form === c?.form && s.tone === c?.tone)?.label ?? null;


  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background/40 transition hover:border-border">
      <button
        type="button"
        onClick={generated ? onPreview : onGenerate}
        disabled={!generated && disabled}
        aria-label={generated ? `Preview ${label}` : `Generate ${label}`}
        className={`group relative block aspect-[16/10] w-full overflow-hidden border-b border-border disabled:cursor-not-allowed ${preview ? "bg-white" : "bg-background/60"}`}
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full rounded-lg object-contain p-2 transition group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted/10">
            <span className="flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/40 px-3 py-1.5 text-[11px] text-muted-foreground">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : generated ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {busy ? "Generating…" : generated ? "Ready — open to read or download" : "Not generated"}
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

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
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
          {generated && (
            <Button
              size="sm"
              variant="outline"
              aria-label={`Delete ${label}`}
              className="h-7 px-2 text-[11px] border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onDelete}
            >
              <Trash2 className="mr-1 h-3 w-3" />Delete
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
