import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { SharePayload } from "@/lib/venture-share.functions";
import { ChevronRight } from "lucide-react";

/**
 * Fixed table of contents for the public share page. Category groups expand to
 * reveal their assets; the active item tracks scroll position.
 */
export function ShareSidebar({
  payload,
  activeKey,
  onNavigate,
}: {
  payload: SharePayload;
  activeKey: string | null;
  onNavigate?: (key: string) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Keep the group containing the active item expanded.
    const group = payload.sections.find((s) => s.items.some((i) => i.key === activeKey));
    if (group) setOpen((prev) => (prev[group.key] ? prev : { ...prev, [group.key]: true }));
  }, [activeKey, payload.sections]);

  useEffect(() => {
    if (payload.sections.length) setOpen({ [payload.sections[0].key]: true });
  }, [payload.sections.length]);

  return (
    <nav className="space-y-1 pb-16 text-sm" aria-label="Contents">
      {payload.sections.map((section) => {
        const expanded = open[section.key] ?? false;
        const containsActive = section.items.some((i) => i.key === activeKey);
        return (
          <div key={section.key}>
            <button
              type="button"
              onClick={() => setOpen((p) => ({ ...p, [section.key]: !expanded }))}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium tracking-wide transition-colors",
                containsActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ChevronRight
                className={cn("h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-90")}
              />
              <span className="truncate uppercase">{section.label}</span>
              <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/60">
                {section.items.length}
              </span>
            </button>
            {expanded && (
              <ul className="ml-[1.15rem] border-l border-border/60 pl-3">
                {section.items.map((item) => {
                  const active = item.key === activeKey;
                  return (
                    <li key={item.key}>
                      <a
                        href={`#${item.key}`}
                        onClick={() => onNavigate?.(item.key)}
                        className={cn(
                          "-ml-[13px] flex items-start gap-2.5 rounded-r-lg py-1.5 pl-3 pr-2 text-[13px] leading-snug transition-colors",
                          active
                            ? "border-l-2 border-primary font-medium text-foreground"
                            : "border-l-2 border-transparent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span className="line-clamp-2">{item.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
