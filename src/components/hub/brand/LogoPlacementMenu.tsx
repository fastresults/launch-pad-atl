// @ts-nocheck
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Sparkles } from "lucide-react";
import { LOGO_SLOTS } from "@/components/hub/brand/LogoSetPanel";
import { recommendMark, slotsForKind, studioMarkKind } from "@/lib/brand/collateral-marks";

const labelFor = (cell: any) => LOGO_SLOTS.find((slot) => slot.form === cell?.form && slot.tone === cell?.tone)?.label;

/** Compact split-action companion used beside every Generate/Regenerate control. */
export function LogoPlacementMenu({ assetKind, logos, value, onChange, used, disabled, label = "graphic" }: any) {
  const supplied = new Set((logos ?? []).filter((logo: any) => logo?.variant && (logo?.svg_path || logo?.path || logo?.storage_path)).map((logo: any) => logo.variant));
  const slot = slotsForKind(studioMarkKind(assetKind))[0];
  const inventory = LOGO_SLOTS.filter((logo) => supplied.has(logo.key)).map((logo) => ({ form: logo.form, tone: logo.tone }));
  const recommended = recommendMark(slot, inventory);
  return (
    <div className="inline-flex items-center">
      {used?.form && (
        <Badge variant="outline" className="mr-1 hidden text-[9px] sm:inline-flex">
          {used.mode === "manual" ? "Verified exact" : "AI selected"} · {labelFor(used) ?? `${used.form} · ${used.tone}`}
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" aria-label={`Choose logo for ${label}`} className="h-6 rounded-l-none px-1.5" disabled={disabled}>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[70vh] w-72 overflow-y-auto">
          <DropdownMenuLabel className="text-[11px]">Logo for this graphic</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value ? `${value.form}|${value.tone}` : "auto"} onValueChange={(next) => {
            if (next === "auto") onChange(null);
            else { const [form, tone] = next.split("|"); onChange({ form, tone }); }
          }}>
            <DropdownMenuRadioItem value="auto" className="text-[11px]">
              <Sparkles className="mr-1.5 h-3 w-3" /> Auto — {recommended ? labelFor(recommended) : "AI selects"}
            </DropdownMenuRadioItem>
            <DropdownMenuSeparator />
            {["colour", "inverse"].map((tone) => (
              <div key={tone}>
                <DropdownMenuLabel className="text-[10px] font-normal uppercase text-muted-foreground">{tone}</DropdownMenuLabel>
                {LOGO_SLOTS.filter((logo) => logo.tone === tone).map((logo) => {
                  const available = supplied.has(logo.key);
                  return <DropdownMenuRadioItem key={logo.key} value={`${logo.form}|${logo.tone}`} disabled={!available} className="text-[11px]">
                    <span className="flex w-full justify-between gap-2"><span>{logo.label}</span>{!available && <span className="text-muted-foreground">Not supplied</span>}</span>
                  </DropdownMenuRadioItem>;
                })}
              </div>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}