import { Suspense, lazy, useState } from "react";
import { Loader2, MessageCircle, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SharePayload } from "@/lib/venture-share.functions";
import { ShareChatPanel } from "@/components/share/ShareChatPanel";

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
}: {
  token: string;
  password?: string;
  payload: SharePayload;
  onOpenItem: (key: string) => void;
}) {
  const chatOn = payload.chatEnabled !== false;
  const mapOn = payload.mapEnabled !== false;
  const [tab, setTab] = useState<"ask" | "map">(chatOn ? "ask" : "map");

  const tabs: { id: "ask" | "map"; label: string; icon: typeof MessageCircle }[] = [
    ...(chatOn ? [{ id: "ask" as const, label: "Ask anything", icon: MessageCircle }] : []),
    ...(mapOn ? [{ id: "map" as const, label: "Mind map", icon: Network }] : []),
  ];
  if (!tabs.length) return null;

  return (
    <section className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Second brain</p>
      <h2 className="mt-2 font-serif text-[28px] leading-tight tracking-tight md:text-[34px]">
        Ask this venture anything
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Every asset in this showcase is loaded into one assistant. Type or speak a question, or open
        the map to see how the whole venture connects.
      </p>

      {tabs.length > 1 && (
        <div className="mt-6 inline-flex rounded-full border border-border/60 bg-card/50 p-1">
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

      <div className="mt-6">
        {tab === "ask" && chatOn && (
          <ShareChatPanel
            token={token}
            password={password}
            ventureName={payload.venture.name}
            embedded
          />
        )}
        {tab === "map" && mapOn && (
          <Suspense
            fallback={
              <div className="flex h-[min(68vh,640px)] items-center justify-center rounded-2xl border border-border/60 bg-card/40">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ShareMindMap payload={payload} onOpenItem={onOpenItem} />
          </Suspense>
        )}
      </div>
    </section>
  );
}
