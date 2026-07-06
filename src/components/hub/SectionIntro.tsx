import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SectionIntroCopy } from "@/lib/hub-dashboard-copy";

/**
 * Compact orientation header shown above each major section of the venture
 * workspace. Answers the three novice questions: what is this, why does it
 * matter, and how do I use it (in the popover).
 */
export function SectionIntro({ copy }: { copy: SectionIntroCopy }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-l-2 border-primary/40 pl-4">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
          {copy.eyebrow}
        </div>
        <div className="text-sm font-medium text-foreground">{copy.what}</div>
        <div className="text-xs text-muted-foreground">{copy.why}</div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="How to use this section"
            className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            <Info className="h-3.5 w-3.5" />
            How to use
          </button>
        </PopoverTrigger>
        <PopoverContent side="left" align="start" className="max-w-[300px] text-xs leading-relaxed">
          <div className="mb-1.5 font-medium text-foreground">How to use this</div>
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
  );
}
