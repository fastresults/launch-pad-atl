import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { SharePayload } from "@/lib/venture-share.functions";
import { ArrowUpRight, ChevronRight, ExternalLink, FileText, Image as ImageIcon, Images, Route, Search, Sparkle } from "lucide-react";
import { mediaHintForItem, sectionHasMedia, type MediaHint } from "@/components/share/share-media-hint";

/** Small muted glyph marking rows whose preview contains pictures. */
function MediaCue({
  hint,
  sheet,
  active,
}: {
  hint: MediaHint;
  sheet: boolean;
  active: boolean;
}) {
  if (!hint) return null;
  const size = sheet ? "h-4 w-4" : "h-3.5 w-3.5";
  const tone = active ? "text-foreground/80" : "text-muted-foreground/60";
  return (
    <span
      className={cn("ml-auto flex shrink-0 items-center gap-1", tone)}
      title={hint.label}
      aria-label={hint.label}
    >
      {hint.kind === "palette" ? (
        <span className="flex items-center gap-0.5" aria-hidden>
          {hint.colors.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className={cn("rounded-full", sheet ? "h-2.5 w-2.5" : "h-2 w-2")}
              style={{ backgroundColor: c }}
            />
          ))}
        </span>
      ) : hint.kind === "images" ? (
        <>
          <Images className={size} aria-hidden />
          <span className="text-[11px] tabular-nums">{hint.count}</span>
        </>
      ) : (
        <ImageIcon className={size} aria-hidden />
      )}
    </span>
  );
}

/** Sidebar key for the featured second-brain tool (not a payload asset). */
export const BRAIN_KEY = "tool:brain";

/** The launch cadence rides at the top of the contents, not buried in Overview. */
export const TIMELINE_KEY = "overview:timeline";

/** Opens the "next step" consultation invitation instead of a document. */
export const OUTRO_KEY = "tool:operationalize";



/**
 * Table of contents for the public share page. With 60+ assets the list has to
 * stay navigable: categories collapse, the active branch stays open, and a
 * filter narrows the whole tree by title.
 */
export function ShareSidebar({
  payload,
  activeKey,
  onNavigate,
  variant = "rail",
  viewedKeys,
}: {
  payload: SharePayload;
  activeKey: string | null;
  onNavigate?: (key: string) => void;
  /** "sheet" renders thumb-sized rows for the mobile contents sheet. */
  variant?: "rail" | "sheet";
  /** Assets already read, marked with a dot so progress is visible. */
  viewedKeys?: string[];
}) {
  const sheet = variant === "sheet";
  const seen = useMemo(() => new Set(viewedKeys ?? []), [viewedKeys]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const [query, setQuery] = useState("");

  const hasTimeline = payload.sections.some((s) => s.items.some((i) => i.key === TIMELINE_KEY));

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    // The timeline is pinned above, so it never appears twice in the tree.
    const base = payload.sections
      .map((s) => ({ ...s, items: s.items.filter((i) => i.key !== TIMELINE_KEY) }))
      .filter((s) => s.items.length > 0);
    if (!q) return base;
    return base
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

  const brainOn = payload.chatEnabled !== false || payload.mapEnabled !== false;
  const hasSummary = payload.sections.some((s) =>
    s.items.some((i) => i.key === "overview:executive"),
  );

  const pinned = [
    ...(brainOn
      ? [{ key: BRAIN_KEY, label: "Second brain", hint: "Ask anything · mind map", icon: Sparkle }]
      : []),
    ...(hasTimeline
      ? [{ key: TIMELINE_KEY, label: "Launch timeline", hint: "Idea to cash flowing", icon: Route }]
      : []),
    ...(hasSummary
      ? [{ key: "overview:executive", label: "Executive summary", hint: "The venture in 300 words", icon: FileText }]
      : []),
  ];


  const website = payload.venture.website?.trim() || null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {website && (
        // The live site is the one link a visitor is most likely to want.
        <a
          href={`https://${website}`}
          target="_blank"
          rel="noreferrer noopener"
          className={cn("mb-3 flex shrink-0 items-center gap-3 rounded-xl border border-primary/50 bg-primary/10 px-3 transition-colors hover:border-primary hover:bg-primary/15", sheet ? "min-h-[52px] py-3" : "py-2.5")}
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-foreground">Visit website</span>
            <span className="block truncate text-[11px] text-muted-foreground">{website}</span>
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </a>
      )}
      {pinned.length > 0 && (
        <div className="mb-4 shrink-0 space-y-1.5">

          {pinned.map((p) => {
            const active = activeKey === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onNavigate?.(p.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 text-left transition-colors",
                  sheet ? "min-h-[52px] py-3" : "py-2.5",
                  active
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 bg-card/40 hover:border-primary/40",
                )}
              >
                <p.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-foreground">{p.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{p.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="relative mb-4 shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${total} assets`}
          aria-label="Search assets"
          className={cn(sheet ? "h-11 text-[15px]" : "h-9 text-[13px]", "w-full rounded-lg border border-border/60 bg-card/40 pl-9 pr-3 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none")}
        />
      </div>

      {/* Only the tree scrolls, so the pinned tools and search never leave. */}
      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-10 text-sm [mask-image:linear-gradient(to_bottom,black_calc(100%-32px),transparent)]"
        aria-label="Contents"
      >

        {sections.map((section) => {
          const expanded = filtering || (open[section.key] ?? false);
          const containsActive = section.items.some((i) => i.key === activeKey);
          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => setOpen((p) => ({ ...p, [section.key]: !expanded }))}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 text-left font-medium tracking-wide transition-colors",
                  sheet ? "min-h-[48px] py-3 text-[14px]" : "py-2 text-[13px]",
                  containsActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ChevronRight
                  className={cn("h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-90")}
                />
                <span className="truncate uppercase">{section.label}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground/60">
                  {sectionHasMedia(section.items) && (
                    <span title="Includes images" className="flex">
                      <Images className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  )}
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
                            "-ml-[13px] flex items-start gap-2.5 rounded-r-lg pl-3 pr-2 leading-snug transition-colors",
                            sheet ? "min-h-[44px] items-center py-2.5 text-[15px]" : "py-1.5 text-[13px]",
                            active
                              ? "border-l-2 border-primary font-medium text-foreground"
                              : "border-l-2 border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span className="line-clamp-2">{item.title}</span>
                          <MediaCue hint={mediaHintForItem(item)} sheet={sheet} active={active} />
                          {seen.has(item.key) && !active && (
                            <span
                              aria-hidden
                              className={cn(
                                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60",
                                !mediaHintForItem(item) && "ml-auto",
                              )}
                            />
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
