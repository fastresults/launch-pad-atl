import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "@/lib/use-document-title";
import { fetchSharePayload, trackShareView, type SharePayload } from "@/lib/venture-share.functions";
import { ShareSidebar, BRAIN_KEY, TIMELINE_KEY } from "@/components/share/ShareSidebar";
import { decodeScenario, encodeScenario, type TimelineScenario } from "@/lib/venture-timeline";
import { ShareSection } from "@/components/share/ShareSection";
import { ShareBrain } from "@/components/share/ShareBrain";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, ArrowRight, Loader2, Lock, Menu, Sparkle } from "lucide-react";

export default function VentureSharePage() {
  const { token = "" } = useParams();
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState<string | undefined>(undefined);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const [stepId, setStepId] = useState<string | null>(null);
  const [seedQuestion, setSeedQuestion] = useState<string | null>(null);
  const [readerScenario, setReaderScenario] = useState<TimelineScenario | null>(null);
  const paneRef = useRef<HTMLElement>(null);
  const tracked = useRef(false);


  const q = useQuery({
    queryKey: ["venture-share", token, submitted],
    queryFn: () => fetchSharePayload(token, submitted),
    retry: false,
  });

  const payload = q.data as SharePayload | undefined;
  const items = useMemo(() => payload?.sections.flatMap((s) => s.items) ?? [], [payload]);

  useEffect(() => {
    if (payload && !tracked.current) {
      tracked.current = true;
      void trackShareView(token, submitted);
    }
  }, [payload, token, submitted]);

  // One asset at a time: 60+ documents in a single scroll is unreadable.
  // The hash keeps every asset individually linkable.
  useEffect(() => {
    if (!items.length) return;
    // The hash carries an asset key, optionally a timeline step: "key/step-id".
    const raw = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const [hashKey, hashStep] = raw.split("/");
    const initial =
      hashKey === BRAIN_KEY ? BRAIN_KEY : items.find((i) => i.key === hashKey)?.key ?? items[0].key;
    setActiveKey((prev) => prev ?? initial);
    if (hashKey === TIMELINE_KEY && hashStep) setStepId(hashStep);
    const params = new URLSearchParams(window.location.search);
    const decoded = decodeScenario(params.get("s"));
    if (decoded) setReaderScenario(decoded);
  }, [items]);

  const brainOn = (payload?.chatEnabled !== false || payload?.mapEnabled !== false) && !!payload;
  const brainActive = activeKey === BRAIN_KEY;
  const timelineActive = activeKey === TIMELINE_KEY;
  const activeIndex = items.findIndex((i) => i.key === activeKey);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;
  const activeSection = payload?.sections.find((s) => s.items.some((i) => i.key === activeKey));

  const hashFor = (key: string, step?: string | null) =>
    `${window.location.pathname}${window.location.search}#${step ? `${key}/${step}` : key}`;

  const goTo = (key: string, step?: string | null) => {
    setActiveKey(key);
    if (key !== TIMELINE_KEY) setStepId(null);
    else if (step !== undefined) setStepId(step ?? null);
    history.replaceState(null, "", hashFor(key, key === TIMELINE_KEY ? step ?? stepId : null));
    // The reading pane scrolls, not the window.
    paneRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (key === BRAIN_KEY || key === TIMELINE_KEY) setCondensed(true);
  };

  /** Selecting a step keeps the link shareable down to the bar. */
  const selectStep = (id: string | null) => {
    setStepId(id);
    history.replaceState(null, "", hashFor(TIMELINE_KEY, id));
  };

  /** A reader's what-if rides in the query string so they can send it back. */
  const onScenarioChange = (s: TimelineScenario, dirty: boolean) => {
    setReaderScenario(dirty ? s : null);
    const params = new URLSearchParams(window.location.search);
    if (dirty) params.set("s", encodeScenario(s));
    else params.delete("s");
    const qs = params.toString();
    history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`,
    );
  };

  const askBrain = (question: string) => {
    setSeedQuestion(question);
    goTo(BRAIN_KEY);
  };



  useDocumentTitle(
    payload ? `${payload.venture.name} — venture showcase` : "Venture showcase",
    payload?.venture.oneLiner?.slice(0, 155) ?? "A complete startup, built and ready to launch.",
  );

  const err = q.error as any;
  const needsPassword = err?.code === "PASSWORD_REQUIRED" || err?.code === "PASSWORD_INVALID";

  return (
    <div className="theme-dark-scope min-h-screen bg-background text-foreground">
      {q.isLoading && (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {needsPassword && (
        <div className="flex min-h-screen items-center justify-center px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(password);
            }}
            className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/60 p-8 text-center backdrop-blur"
          >
            <Lock className="mx-auto mb-4 h-6 w-6 text-muted-foreground" />
            <h1 className="font-serif text-2xl tracking-tight">This showcase is protected</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter the password you were given.</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-5"
              autoFocus
            />
            {err?.code === "PASSWORD_INVALID" && (
              <p className="mt-2 text-xs text-destructive">That password didn't work.</p>
            )}
            <Button type="submit" className="mt-4 w-full">
              View showcase
            </Button>
          </form>
        </div>
      )}

      {q.isError && !needsPassword && (
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <div>
            <h1 className="font-serif text-3xl tracking-tight">
              {err?.code === "NETWORK" ? "Couldn't load this showcase" : "Link unavailable"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{err?.message}</p>
            {err?.code === "NETWORK" && (
              <Button variant="outline" className="mt-5" onClick={() => q.refetch()}>
                Try again
              </Button>
            )}
          </div>
        </div>
      )}


      {payload && (
        <div className="flex h-[100svh] flex-col overflow-hidden">
          {/* Masthead — condenses once the reader starts working. */}
          <header
            className={`shrink-0 border-b border-border/60 bg-gradient-to-b from-card/70 to-background transition-all ${
              condensed ? "py-2" : "py-6 md:py-10"
            }`}
          >
            <div className="mx-auto flex max-w-[1400px] items-center gap-5 px-6 md:px-10">
              <Sheet open={navOpen} onOpenChange={setNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open contents">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="theme-dark-scope flex w-[85vw] max-w-xs flex-col bg-background p-6">
                  <ShareSidebar
                    payload={payload}
                    activeKey={activeKey}
                    onNavigate={(k) => {
                      goTo(k);
                      setNavOpen(false);
                    }}
                  />
                </SheetContent>
              </Sheet>

              {payload.venture.logoUrl && (
                <img
                  src={payload.venture.logoUrl}
                  alt={payload.venture.name}
                  className={`shrink-0 rounded-lg object-contain transition-all ${
                    condensed ? "h-9 w-9" : "h-12 w-12 md:h-16 md:w-16"
                  }`}
                />
              )}
              <div className="min-w-0">
                {!condensed && (
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Venture showcase · {items.length} assets
                  </p>
                )}
                <h1
                  className={`truncate font-serif leading-tight tracking-tight ${
                    condensed ? "text-[18px]" : "mt-1 text-[26px] md:text-[40px]"
                  }`}
                >
                  {payload.venture.name}
                </h1>
                {payload.venture.oneLiner && !condensed && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {payload.venture.oneLiner}
                  </p>
                )}
              </div>
              {payload.venture.website && (
                <Button
                  asChild
                  size={condensed ? "sm" : "default"}
                  className="ml-auto shrink-0"
                >
                  <a
                    href={`https://${payload.venture.website}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Visit website
                  </a>
                </Button>
              )}
              {brainOn && (
                <Button
                  variant="outline"
                  size={condensed ? "sm" : "default"}
                  className={`hidden shrink-0 md:inline-flex ${payload.venture.website ? "" : "ml-auto"}`}
                  onClick={() => goTo(BRAIN_KEY)}
                >
                  <Sparkle className="mr-1.5 h-4 w-4" />
                  Ask this venture
                </Button>
              )}
            </div>
          </header>

          <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 gap-12 overflow-hidden px-6 md:px-10">
            <aside className="hidden w-72 shrink-0 py-8 lg:block">
              <ShareSidebar payload={payload} activeKey={activeKey} onNavigate={goTo} />
            </aside>

            <main
              ref={paneRef}
              onScroll={(e) => setCondensed(e.currentTarget.scrollTop > 24)}
              className={`min-w-0 flex-1 overflow-y-auto ${
                brainActive ? "flex flex-col py-6" : timelineActive ? "pb-16 pt-4" : "pb-24 pt-8"
              }`}
            >

              {brainActive ? (
                <ShareBrain
                  token={token}
                  password={submitted}
                  payload={payload}
                  onOpenItem={goTo}
                  seedQuestion={seedQuestion}
                />
              ) : (
                <>
                  {activeSection && (
                    <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                      {activeSection.label}
                    </p>
                  )}
                  {activeItem && (
                    <ShareSection
                      item={activeItem}
                      accent={payload.venture.colors?.accent ?? null}
                      onOpenAsset={(key) => goTo(key)}
                      onAsk={askBrain}
                      selectedStepId={timelineActive ? stepId : null}
                      onSelectStep={selectStep}
                      scenarioOverride={timelineActive ? readerScenario : null}
                      onScenarioChange={onScenarioChange}
                    />
                  )}
                </>
              )}


              {/* Prev / next keeps the whole set walkable without the sidebar. */}
              <div hidden={brainActive || timelineActive} className="mt-8 flex items-stretch justify-between gap-4 border-t border-border/60 pt-6">
                {activeIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => goTo(items[activeIndex - 1].key)}
                    className="group max-w-[46%] text-left"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <ArrowLeft className="h-3.5 w-3.5" /> Previous
                    </span>
                    <span className="mt-1 block truncate text-sm text-foreground group-hover:text-primary">
                      {items[activeIndex - 1].title}
                    </span>
                  </button>
                ) : (
                  <span />
                )}
                {activeIndex >= 0 && activeIndex < items.length - 1 && (
                  <button
                    type="button"
                    onClick={() => goTo(items[activeIndex + 1].key)}
                    className="group max-w-[46%] text-right"
                  >
                    <span className="flex items-center justify-end gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Next <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="mt-1 block truncate text-sm text-foreground group-hover:text-primary">
                      {items[activeIndex + 1].title}
                    </span>
                  </button>
                )}
              </div>

              {!brainActive && (
                <footer className="mt-12 border-t border-border/60 pt-8 text-xs text-muted-foreground">
                  Built with Startup Labs · The 14-Day Pivot Method
                </footer>
              )}
            </main>
          </div>

          {/* One launcher only — it routes into the Second Brain section. */}
          {brainOn && !brainActive && (
            <button
              type="button"
              onClick={() => goTo(BRAIN_KEY)}
              className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-[1.03]"
            >
              <Sparkle className="h-4 w-4" />
              Ask this venture
            </button>
          )}
        </div>
      )}

    </div>
  );
}
