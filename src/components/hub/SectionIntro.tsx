import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SectionIntroCopy } from "@/lib/hub-dashboard-copy";
import type { ReactNode } from "react";

/**
 * Quiet one-line orientation label shown above each major section of the
 * venture workspace. The section's own component provides the visual title;
 * this row just numbers the flow and hides the "why + how" behind an info
 * popover so it never competes with the content underneath.
 */
export function SectionIntro({
  copy,
  actions,
}: {
  copy: SectionIntroCopy;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {copy.eyebrow}
      </div>
      <div className="flex items-center gap-1">
        {actions}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`About ${copy.eyebrow}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="left" align="start" className="max-w-[320px] text-xs leading-relaxed">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
              Why this matters
            </div>
            <p className="mb-3 text-foreground">{copy.why}</p>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
              How to use it
            </div>
            <ul className="space-y-1.5 text-muted-foreground">
              {copy.howTo.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
