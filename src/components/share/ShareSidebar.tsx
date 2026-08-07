import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { SharePayload } from "@/lib/venture-share.functions";
import { ChevronRight, Search } from "lucide-react";

/**
 * Table of contents for the public share page. With 60+ assets the list has to
 * stay navigable: categories collapse, the active branch stays open, and a
 * filter narrows the whole tree by title.
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
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payload.sections;
    return payload.sections
      .map((s) => ({ ...s, items: s.items.filter((i) => i.title.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [payload.sections, query]);

  useEffect(() => {
    // Keep the group containing the active item expanded.
    const group = payload.sections.find((s) => s.items.some((i) => i.key === activeKey));
    if (group) setOpen((prev) => (prev[group.key] ? prev : { ...prev, [group.key]: true }));
  }, [activeKey, payload.sections]);

  const filtering = query.trim().length > 0;
  const total = payload.sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="pb-16">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${total} assets`}
          aria-label="Search assets"
          className="h-9 w-full rounded-lg border border-border/60 bg-card/40 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
        />
      </div>

      <nav className="space-y-1 text-sm" aria-label="Contents">
        {sections.map((section) => {
          const expanded = filtering || (open[section.key] ?? false);
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
                          onClick={(e) => {
                            if (onNavigate) {
                              e.preventDefault();
                              onNavigate(item.key);
                            }
                          }}
                          className={cn(
                            "-ml-[13px] flex items-start gap-2.5 rounded-r-lg py-1.5 pl-3 pr-2 text-[13px] leading-snug transition-colors",
                            active
                              ? "border-l-2 border-primary font-medium text-foreground"
                              : "border-l-2 border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          {item.kind === "gallery" && !!item.images?.length && (
                            <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground/60">
                              {item.images.length}
                            </span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        {!sections.length && (
          <p className="px-3 py-6 text-[13px] text-muted-foreground">No assets match "{query}".</p>
        )}
      </nav>
    </div>
  );
}
