// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, RotateCcw } from "lucide-react";

function isHex(s: string) {
  return /^#([0-9a-f]{6})$/i.test(s);
}

export function EditablePaletteSwatch({
  tokenKey,
  value,
  originalValue,
  onChange,
  size = "md",
  showLabel = false,
}: {
  tokenKey: string;
  value: string;
  originalValue?: string;
  onChange: (hex: string) => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setDraft(value), [value]);

  const commit = (next: string) => {
    if (!isHex(next)) return;
    onChange(next);
  };
  const commitDebounced = (next: string) => {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), 250);
  };

  const sizeCls =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  return (
    <div className="inline-flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={`${tokenKey} · ${value} — click to change`}
            className={`group relative ${sizeCls} rounded border border-white/20 hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary`}
            style={{ background: value }}
          >
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <Pencil className="h-2.5 w-2.5 text-white" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-3 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tokenKey}
            </div>
            {originalValue && originalValue !== draft && (
              <button
                type="button"
                onClick={() => { setDraft(originalValue); commit(originalValue); }}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                title={`Reset to ${originalValue}`}
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isHex(draft) ? draft : "#000000"}
              onChange={(e) => commitDebounced(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
              aria-label={`Pick color for ${tokenKey}`}
            />
            <Input
              value={draft}
              onChange={(e) => {
                const v = e.target.value.trim();
                setDraft(v);
                if (isHex(v)) commit(v);
              }}
              placeholder="#RRGGBB"
              className="h-9 font-mono text-xs"
              maxLength={7}
            />
          </div>
          <Button size="sm" variant="secondary" className="w-full" onClick={() => setOpen(false)}>
            Done
          </Button>
        </PopoverContent>
      </Popover>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground">{tokenKey}</span>
      )}
    </div>
  );
}
