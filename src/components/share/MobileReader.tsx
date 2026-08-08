import { cn } from "@/lib/utils";
import type { SharePayload, ShareItem } from "@/lib/venture-share.functions";
import { ArrowLeft, ArrowRight, Check, List, Share2, Sparkle } from "lucide-react";

type Section = SharePayload["sections"][number];

/** Slim horizontal scroller: where the reader is in the overall arc. */
export function CategoryStepper({
  sections,
  activeSectionKey,
  onJump,
}: {
  sections: Section[];
  activeSectionKey: string | null;
  onJump: (key: string) => void;
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max items-center gap-2 py-2">
        {sections.map((s) => {
          const active = s.key === activeSectionKey;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onJump(s.items[0]?.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors",
                active
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border/60 text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Full-width card announcing a new category, with direct jumps inside it. */
export function ChapterCard({
  section,
  activeKey,
  onJump,
}: {
  section: Section;
  activeKey: string | null;
  onJump: (key: string) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-primary/40 bg-primary/5 p-4">
      <p className="text-[10.5px] uppercase tracking-[0.22em] text-primary">New chapter</p>
      <h2 className="mt-1 font-serif text-[22px] leading-tight text-foreground">{section.label}</h2>
      <p className="mt-1 text-[12px] text-muted-foreground">
        {section.items.length} {section.items.length === 1 ? "asset" : "assets"} in this chapter
      </p>
      <div className="-mx-4 mt-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {section.items.map((i, n) => (
            <button
              key={i.key}
              type="button"
              onClick={() => onJump(i.key)}
              className={cn(
                "max-w-[190px] shrink-0 truncate rounded-lg border px-3 py-2 text-left text-[12px]",
                i.key === activeKey
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border/60 text-muted-foreground",
              )}
            >
              {n + 1}. {i.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Full-width stacked prev/next, with an explicit end-of-chapter handoff. */
export function MobilePrevNext({
  prev,
  next,
  nextSection,
  chapterDone,
  onGo,
  onContents,
}: {
  prev: { item: ShareItem; sectionLabel?: string } | null;
  next: { item: ShareItem; sectionLabel?: string } | null;
  /** Label of the chapter the next asset belongs to, when it differs. */
  nextSection: string | null;
  chapterDone: { label: string; position: string } | null;
  onGo: (key: string) => void;
  onContents: () => void;
}) {
  return (
    <div className="mt-8 space-y-3 border-t border-border/60 pt-5">
      {chapterDone && next && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
          <p className="text-[12px] text-muted-foreground">
            {chapterDone.label} complete — {chapterDone.position}.
          </p>
          <p className="mt-1 font-serif text-[19px] leading-tight text-foreground">
            Up next: {nextSection}
          </p>
        </div>
      )}

      {next ? (
        <button
          type="button"
          onClick={() => onGo(next.item.key)}
          className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-primary/60 bg-primary/10 px-4 py-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-primary">
              {nextSection ? `Start ${nextSection}` : "Next"}
            </span>
            <span className="mt-0.5 block truncate text-[15px] text-foreground">
              {next.item.title}
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onContents}
          className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-primary/60 bg-primary/10 px-4 py-3 text-left"
        >
          <Check className="h-5 w-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-primary">
              You've reached the end
            </span>
            <span className="mt-0.5 block truncate text-[15px] text-foreground">
              Back to contents
            </span>
          </span>
        </button>
      )}

      {prev && (
        <button
          type="button"
          onClick={() => onGo(prev.item.key)}
          className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-border/60 px-4 py-3 text-left"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Previous{prev.sectionLabel ? ` · ${prev.sectionLabel}` : ""}
            </span>
            <span className="mt-0.5 block truncate text-[14px] text-foreground">
              {prev.item.title}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

/** Thumb bar: lateral actions plus a permanent forward move. */
export function MobileBottomBar({
  brainOn,
  nextTitle,
  onContents,
  onAsk,
  onShare,
  onNext,
}: {
  brainOn: boolean;
  nextTitle: string | null;
  onContents: () => void;
  onAsk: () => void;
  onShare: () => void;
  onNext: () => void;
}) {
  const cell = "flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 text-[10.5px]";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="grid grid-cols-4">
        <button type="button" onClick={onContents} className={cn(cell, "text-muted-foreground")}>
          <List className="h-5 w-5" />
          Contents
        </button>
        <button
          type="button"
          onClick={onAsk}
          disabled={!brainOn}
          className={cn(cell, "text-primary disabled:opacity-40")}
        >
          <Sparkle className="h-5 w-5" />
          Ask
        </button>
        <button type="button" onClick={onShare} className={cn(cell, "text-muted-foreground")}>
          <Share2 className="h-5 w-5" />
          Share
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!nextTitle}
          className={cn(cell, "bg-primary/15 text-foreground disabled:opacity-40")}
        >
          <ArrowRight className="h-5 w-5 text-primary" />
          <span className="w-full truncate text-center">{nextTitle ?? "End"}</span>
        </button>
      </div>
    </nav>
  );
}
