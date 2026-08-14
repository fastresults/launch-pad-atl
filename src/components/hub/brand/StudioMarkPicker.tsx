// @ts-nocheck
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Sparkles } from "lucide-react";
import { LOGO_SLOTS } from "@/components/hub/brand/LogoSetPanel";
import { recommendMark, slotsForKind, studioMarkKind } from "@/lib/brand/collateral-marks";

const AUTO = "auto";
const toKey = (c) => (c ? `${c.form}|${c.tone}` : AUTO);

/**
 * Which mark a studio asset carries. Same contract as Branded Collateral:
 * a chosen cell is exact artwork (never recoloured, never substituted), and
 * Auto hands the decision to the same symmetry recommender the worker runs.
 */
export function StudioMarkPicker({
  assetKind,
  logos,
  value,
  onChange,
  used,
}: {
  assetKind: string;
  logos?: any[] | null;
  value?: { form: string; tone: string } | null;
  onChange: (cell: { form: string; tone: string } | null) => void;
  /** What the last run actually drew, from the saved asset metadata. */
  used?: { form?: string; tone?: string; mode?: string; reason?: string | null } | null;
}) {
  const supplied = new Set(
    (logos ?? [])
      .filter((l: any) => l?.variant && (l?.svg_path || l?.path || l?.storage_path))
      .map((l: any) => l.variant),
  );
  const slot = slotsForKind(studioMarkKind(assetKind))[0];
  const inventory = LOGO_SLOTS.filter((s) => supplied.has(s.key)).map((s) => ({ form: s.form, tone: s.tone }));
  const rec = inventory.length ? recommendMark(slot, inventory) : null;
  const cellLabel = (c) => LOGO_SLOTS.find((s) => s.form === c?.form && s.tone === c?.tone)?.label ?? null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium">Logo version</span>
        {used?.form && (
          <Badge variant="secondary" className="text-[10px]">
            {used.mode === "manual" ? "Verified exact" : "AI selected"}: {cellLabel(used) ?? `${used.form} · ${used.tone}`}
          </Badge>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-full justify-between text-xs">
            <span className="truncate">
              {value
                ? `${cellLabel(value) ?? `${value.form} · ${value.tone}`} — exact`
                : `Auto — ${rec ? cellLabel(rec) ?? "recommended" : "recommended"}`}
            </span>
            <ChevronDown className="ml-1 h-3 w-3 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-[11px]">{slot.label}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={toKey(value)}
            onValueChange={(v) => {
              if (v === AUTO) return onChange(null);
              const [form, tone] = v.split("|");
              onChange({ form, tone });
            }}
          >
            <DropdownMenuRadioItem value={AUTO} className="text-xs">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Auto — AI selects{rec ? ` (${cellLabel(rec)})` : ""}
            </DropdownMenuRadioItem>
            <DropdownMenuSeparator />
            {LOGO_SLOTS.map((s) => {
              const has = supplied.has(s.key);
              return (
                <DropdownMenuRadioItem
                  key={s.key}
                  value={`${s.form}|${s.tone}`}
                  disabled={!has}
                  className="text-xs"
                >
                  {s.label}
                  {!has && <span className="ml-1.5 text-[10px] text-muted-foreground">not supplied</span>}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-[10px] leading-snug text-muted-foreground">
        A chosen version is placed exactly as drawn — if it needs help reading on the artwork, the
        surface adapts, never the logo.
      </p>
    </div>
  );
}
