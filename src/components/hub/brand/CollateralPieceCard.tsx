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
import { recommendMark, slotsForKind } from "@/lib/brand/collateral-marks";

const AUTO = "auto";
const toKey = (c: { form: string; tone: string } | null | undefined) =>
  c ? `${c.form}|${c.tone}` : AUTO;


/**
 * One deliverable in the collateral library. Uniform height, artwork-first —
 * the piece is the product, so it gets the space.
 */
export function CollateralPieceCard({
  kind,
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
  /** The collateral kind — decides which mark slots this piece renders. */
  kind: string;
  label: string;
  note: string;
  preview: string | null;
  fileCount: number;
  stale: boolean;
  qc: { ok: boolean; reasons: string[] } | null;
  busy: boolean;
  canGenerate: boolean;
  disabled: boolean;
  /** The founder's chosen form × tone per mark slot; missing slots are automatic. */
  markChoice?: Record<string, { form: string; tone: string }> | null;
  /** What the last run actually drew in each slot. */
  markUsed?: {
    slot: string;
    form: string;
    tone: string;
    fallback?: boolean;
    recoloured?: boolean;
    auto?: boolean;
    reason?: string | null;
    source?: string | null;
    mode?: "manual" | "auto";
    adapted?: boolean;
  }[] | null;
  /** Slot keys the venture has actually supplied — everything else reads as absent. */
  availableSlots?: Record<string, boolean>;
  onMarkChoice?: (slotId: string, choice: { form: string; tone: string } | null) => void;
  onPreview: () => void;
  onGenerate: () => void;
  /** Remove every file for this piece. Only offered once something exists. */
  onDelete: () => void;
}) {
  const generated = fileCount > 0;
  const supplied = availableSlots ?? {};
  const slots = slotsForKind(kind);
  const cellLabel = (c?: { form: string; tone: string } | null) =>
    LOGO_SLOTS.find((s) => s.form === c?.form && s.tone === c?.tone)?.label ?? null;

  // The inventory the recommender scores against: the cells actually supplied.
  const inventory = LOGO_SLOTS.filter((s) => supplied[s.key]).map((s) => ({ form: s.form, tone: s.tone }));
  const used = markUsed ?? [];




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
            {used.map((m) => {
            const slot = slots.find((s) => s.id === m.slot);
            return (
                <Badge key={m.slot} variant="outline" className="text-[10px] text-muted-foreground">
                  {m.mode === "manual" ? "Verified exact" : "AI selected"} · {slot?.label ?? m.slot}: {cellLabel(m) ?? `${m.form} · ${m.tone}`}
                {m.fallback ? " (nearest supplied)" : ""}
              </Badge>
            );
          })}
          {used.some((m) => m.recoloured) && (
            <Badge variant="outline" className="border-status-warning/50 text-[10px] text-status-warning">
              Recoloured for contrast
            </Badge>
          )}
          {used.some((m) => m.adapted) && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Surface adapted for exact logo
            </Badge>
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
          <div className="flex items-center">
            <Button
              size="sm"
              variant={generated ? "ghost" : "secondary"}
              className="h-7 rounded-r-none px-2 text-[11px]"
              disabled={disabled || !canGenerate}
              onClick={onGenerate}
            >
              {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              {generated ? "Regenerate" : "Generate"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant={generated ? "ghost" : "secondary"}
                  aria-label={`Choose the mark for ${label}`}
                  className="h-7 rounded-l-none border-l border-border px-1.5"
                  disabled={disabled || !canGenerate}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-[70vh] w-72 overflow-y-auto">
                <DropdownMenuLabel className="text-[11px]">
                  {slots.length > 1 ? "Marks on this piece" : "Mark for this piece"}
                </DropdownMenuLabel>
                {slots.map((slot, i) => {
                  const rec = recommendMark(slot, inventory);
                  return (
                    <div key={slot.id}>
                      {i > 0 && <DropdownMenuSeparator />}
                      {slots.length > 1 && (
                        <DropdownMenuLabel className="pb-0 text-[11px] font-medium">
                          {slot.label}
                          <span className="block text-[10px] font-normal text-muted-foreground">{slot.hint}</span>
                        </DropdownMenuLabel>
                      )}
                      <DropdownMenuRadioGroup
                        value={toKey(markChoice?.[slot.id])}
                        onValueChange={(v) => {
                          if (v === AUTO) return onMarkChoice?.(slot.id, null);
                          const [form, tone] = v.split("|");
                          onMarkChoice?.(slot.id, { form, tone });
                        }}
                      >
                        <DropdownMenuRadioItem value={AUTO} className="text-[11px]">
                          <span className="flex flex-col">
                            <span>Auto — recommended</span>
                            {rec && (
                              <span className="text-[10px] text-muted-foreground">
                                {cellLabel(rec) ?? `${rec.form} · ${rec.tone}`} — {rec.reason}
                              </span>
                            )}
                          </span>
                        </DropdownMenuRadioItem>
                        {["colour", "inverse"].map((tone) => (
                          <div key={tone}>
                            <DropdownMenuLabel className="text-[10px] font-normal uppercase tracking-[0.12em] text-muted-foreground">
                              {tone === "colour" ? "Colour — for light grounds" : "Inverse — for dark grounds"}
                            </DropdownMenuLabel>
                            {LOGO_SLOTS.filter((s) => s.tone === tone).map((s) => (
                              <DropdownMenuRadioItem key={s.key} value={`${s.form}|${s.tone}`} className="text-[11px]">
                                <span className="flex w-full items-center justify-between gap-2">
                                  <span>{s.label}</span>
                                  {!supplied[s.key] && <span className="text-[10px] text-muted-foreground">Not supplied</span>}
                                </span>
                              </DropdownMenuRadioItem>
                            ))}
                          </div>
                        ))}
                      </DropdownMenuRadioGroup>
                    </div>
                  );
                })}
              </DropdownMenuContent>

            </DropdownMenu>
          </div>
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
