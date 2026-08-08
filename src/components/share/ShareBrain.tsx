import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2, MessageCircle, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SharePayload } from "@/lib/venture-share.functions";
import { ShareChatPanel } from "@/components/share/ShareChatPanel";
import { MindMapBoundary } from "@/components/share/MindMapBoundary";


const ShareMindMap = lazy(() =>
  import("@/components/share/ShareMindMap").then((m) => ({ default: m.ShareMindMap })),
);

/**
 * The venture's second brain, featured inside the public showcase: ask
 * anything about this venture, or explore every asset as a map. Both views are
 * scoped to the share token, so only this venture is ever reachable.
 */
export function ShareBrain({
  token,
  password,
  payload,
  onOpenItem,
  seedQuestion,
}: {
  token: string;
  password?: string;
  payload: SharePayload;
  onOpenItem: (key: string) => void;
  /** Question handed over from a timeline step. */
  seedQuestion?: string | null;
}) {
  const chatOn = payload.chatEnabled !== false;
  const mapOn = payload.mapEnabled !== false;
  const [tab, setTab] = useState<"ask" | "map">(chatOn ? "ask" : "map");

  useEffect(() => {
    if (seedQuestion && chatOn) setTab("ask");
  }, [seedQuestion, chatOn]);

  const tabs: { id: "ask" | "map"; label: string; icon: typeof MessageCircle }[] = [
    ...(chatOn ? [{ id: "ask" as const, label: "Ask anything", icon: MessageCircle }] : []),
    ...(mapOn ? [{ id: "map" as const, label: "Mind map", icon: Network }] : []),
  ];
  if (!tabs.length) return null;

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      {/* One compact row: title and tabs share the line so the input stays on screen. */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 pb-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Second brain</p>
          <h2 className="mt-1 font-serif text-[24px] leading-tight tracking-tight md:text-[28px]">
            Ask this venture anything
          </h2>
        </div>

        {tabs.length > 1 && (
          <div className="inline-flex shrink-0 rounded-full border border-border/60 bg-card/50 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] transition-colors",
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1">
        {tab === "ask" && chatOn && (
          <ShareChatPanel
            token={token}
            password={password}
            ventureName={payload.venture.name}
            seedQuestion={seedQuestion}
            embedded
          />
        )}
        {tab === "map" && mapOn && (
          <MindMapBoundary
            key={`${token}-${payload.share.updatedAt}`}
            resetKey={`${token}-${payload.share.updatedAt}`}
            onAsk={() => setTab("ask")}
          >
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card/40">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <ShareMindMap payload={payload} onOpenItem={onOpenItem} />
            </Suspense>
          </MindMapBoundary>
        )}

      </div>
    </section>
  );

}
