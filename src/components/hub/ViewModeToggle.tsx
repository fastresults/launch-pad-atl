import { Sparkles, SlidersHorizontal } from "lucide-react";

export type HubViewMode = "guided" | "advanced";

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: HubViewMode;
  onChange: (v: HubViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="inline-flex items-center rounded-full border border-border bg-card/60 p-0.5 text-xs"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "guided"}
        onClick={() => onChange("guided")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
          value === "guided"
            ? "bg-primary/15 text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sparkles className="h-3 w-3" />
        Guided
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "advanced"}
        onClick={() => onChange("advanced")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
          value === "advanced"
            ? "bg-primary/15 text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <SlidersHorizontal className="h-3 w-3" />
        Advanced
      </button>
    </div>
  );
}
