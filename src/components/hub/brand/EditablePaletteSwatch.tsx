// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Pencil, RotateCcw } from "lucide-react";

export function EditablePaletteSwatch({
  tokenKey,
  value,
  originalValue,
  onChange,
  size = "md",
  showLabel = false,
  fill = false,
}: {
  tokenKey: string;
  value: string;
  originalValue?: string;
  onChange: (hex: string) => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  fill?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setDraft(value), [value]);

  const commit = (next: string) => onChange(next);
  const commitDebounced = (next: string) => {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), 250);
  };

  const sizeCls =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  const triggerCls = fill
    ? "group absolute inset-0 h-full w-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
    : `group relative ${sizeCls} rounded border border-border hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary`;

  return (
    <div className={fill ? "contents" : "inline-flex items-center gap-1"}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={`${tokenKey} · ${value} — click to change`}
            className={triggerCls}
            style={fill ? undefined : { background: value }}
          >
            <span className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100 ${fill ? "" : "rounded"}`}>
              <Pencil className={fill ? "h-5 w-5 text-white" : "h-2.5 w-2.5 text-white"} />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3 p-3">
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

          <div className="epaint-wrap">
            <HexColorPicker
              color={draft}
              onChange={commitDebounced}
              style={{ width: "100%", height: 176 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div
              className="h-9 w-10 shrink-0 rounded border border-border"
              style={{ background: draft }}
              aria-hidden
            />
            <div className="flex flex-1 items-center gap-1 rounded-md border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring">
              <span className="text-xs text-muted-foreground">#</span>
              <HexColorInput
                color={draft}
                onChange={(v) => { setDraft(v); commit(v); }}
                className="h-9 w-full bg-transparent font-mono text-xs uppercase outline-none"
                aria-label={`Hex for ${tokenKey}`}
              />
            </div>
          </div>

          <Button size="sm" variant="secondary" className="w-full" onClick={() => setOpen(false)}>
            Done
          </Button>

          {/* Scoped styling for react-colorful to match app tokens */}
          <style>{`
            .epaint-wrap .react-colorful { width: 100%; height: 176px; border-radius: 0.5rem; overflow: hidden; }
            .epaint-wrap .react-colorful__saturation { border-radius: 0.5rem 0.5rem 0 0; }
            .epaint-wrap .react-colorful__hue { height: 16px; border-radius: 0 0 0.5rem 0.5rem; }
            .epaint-wrap .react-colorful__pointer { width: 16px; height: 16px; }
          `}</style>
        </PopoverContent>
      </Popover>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground">{tokenKey}</span>
      )}
    </div>
  );
}
