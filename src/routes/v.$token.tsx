import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchSharePayload, trackShareView, type SharePayload } from "@/lib/venture-share.functions";
import { useSurfaceLogo } from "@/hooks/use-surface-logo";
import { OwnerAssetActions } from "@/components/share/OwnerAssetActions";
import { ShareSidebar, BRAIN_KEY, TIMELINE_KEY } from "@/components/share/ShareSidebar";
import { decodeScenario, encodeScenario, type TimelineScenario } from "@/lib/venture-timeline";
import { ShareSection } from "@/components/share/ShareSection";
import { ShareBrain } from "@/components/share/ShareBrain";
import { SectionExportMenu } from "@/components/share/SectionExportMenu";
import { buildFullDoc, buildSectionDoc } from "@/lib/share-export";
import { SHARE_UI_VERSION } from "@/components/share/preview-copy";
import { ShareOutroDialog } from "@/components/share/ShareOutroDialog";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  CategoryStepper,
  ChapterCard,
  MobileBottomBar,
  MobilePrevNext,
} from "@/components/share/MobileReader";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Loader2,
  Lock,
  Menu,
  Sparkle,
} from "lucide-react";



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
  const isMobile = useIsMobile();
  /** On a phone the second brain is a full-screen sheet, not a pane section. */
  const [brainOpen, setBrainOpen] = useState(false);
  const [blurbOpen, setBlurbOpen] = useState(false);
  /** Assets already opened this session, so the contents shows progress. */
  const [viewed, setViewed] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`share-viewed:${token}`) ?? "[]");
    } catch {
      return [];
    }
  });
  const [swipeHint, setSwipeHint] = useState(
    () => typeof localStorage !== "undefined" && !localStorage.getItem("share-swipe-hint"),
  );
  const paneRef = useRef<HTMLElement>(null);
  const tracked = useRef(false);
  /** The closing "next step" invitation — opened from the nav, never by scrolling. */
  const [outroOpen, setOutroOpen] = useState(false);

  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);




  const q = useQuery({
    queryKey: ["venture-share", token, submitted],
    queryFn: () => fetchSharePayload(token, submitted),
    retry: false,
  });

  const payload = q.data as SharePayload | undefined;
  // The mark that clears contrast on whichever ground the reader is painting.
  const surfaceLogo = useSurfaceLogo(payload?.venture);
  const canManage = !!payload?.canManage && !!payload?.snapshotId;
  const items = useMemo(() => payload?.sections.flatMap((s) => s.items) ?? [], [payload]);

  useEffect(() => {
    if (payload && !tracked.current) {
      tracked.current = true;
      // Stamped so a stale published bundle is identifiable in one look.
      console.info(`[showcase] ${SHARE_UI_VERSION}`);
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

  // A #tool:brain link on a phone opens the sheet rather than the pane section.
  useEffect(() => {
    if (isMobile && activeKey === BRAIN_KEY) {
      setBrainOpen(true);
      setActiveKey(items[0]?.key ?? null);
    }
  }, [isMobile, activeKey, items]);

  // Remember what has been read so the contents can show progress.
  useEffect(() => {
    if (!activeKey || activeKey === BRAIN_KEY) return;
    setViewed((prev) => {
      if (prev.includes(activeKey)) return prev;
      const next = [...prev, activeKey];
      try {
        sessionStorage.setItem(`share-viewed:${token}`, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }, [activeKey, token]);



  const brainOn = (payload?.chatEnabled !== false || payload?.mapEnabled !== false) && !!payload;
  const brainActive = activeKey === BRAIN_KEY;

  const timelineActive = activeKey === TIMELINE_KEY;
  const activeIndex = items.findIndex((i) => i.key === activeKey);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;
  const activeSection = payload?.sections.find((s) => s.items.some((i) => i.key === activeKey));

  const prevItem = activeIndex > 0 ? items[activeIndex - 1] : null;
  const nextItem =
    activeIndex >= 0 && activeIndex < items.length - 1 ? items[activeIndex + 1] : null;
  const sectionOf = (key: string | null | undefined) =>
    key ? payload?.sections.find((s) => s.items.some((i) => i.key === key)) ?? null : null;
  const prevSection = sectionOf(prevItem?.key);
  const nextSection = sectionOf(nextItem?.key);
  /** True when the next asset opens a different chapter than the current one. */
  const crossesChapter = !!nextSection && nextSection.key !== activeSection?.key;
  /** True when the current asset is the first of its chapter (and not the very first). */
  const opensChapter =
    !!activeSection &&
    activeSection.items[0]?.key === activeKey &&
    payload?.sections[0]?.key !== activeSection.key;
  const posInSection = activeSection
    ? activeSection.items.findIndex((i) => i.key === activeKey) + 1
    : 0;


  const hashFor = (key: string, step?: string | null) =>
    `${window.location.pathname}${window.location.search}#${step ? `${key}/${step}` : key}`;

  const goTo = (key: string, step?: string | null) => {
    if (key === OUTRO_KEY) {
      // The invitation is a modal, not a document — the reading pane stays put.
      setNavOpen(false);
      setOutroOpen(true);
      return;
    }
    // Reaching the operations chapter is the moment the "what's next" question lands.
    const section = payload.sections.find((s) => s.items.some((i) => i.key === key));
    if (section && /operation/i.test(`${section.key} ${section.label}`)) setOutroOpen(true);
    if (key === BRAIN_KEY && isMobile) {
      // The brain takes the whole phone screen instead of replacing the reading pane.
      setBrainOpen(true);
      setNavOpen(false);
      return;
    }
    setActiveKey(key);
    if (key !== TIMELINE_KEY) setStepId(null);
    else if (step !== undefined) setStepId(step ?? null);
    history.replaceState(null, "", hashFor(key, key === TIMELINE_KEY ? step ?? stepId : null));
    // The reading pane scrolls, not the window.
    paneRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (key === BRAIN_KEY || key === TIMELINE_KEY) setCondensed(true);
  };

  /** Swipe left/right walks the asset list on touch devices. */
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || touchY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    touchX.current = null;
    touchY.current = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    dismissHint();
    const next = dx < 0 ? activeIndex + 1 : activeIndex - 1;
    if (activeIndex >= 0 && next >= 0 && next < items.length) goTo(items[next].key);
  };

  /** The swipe cue is shown once per device, then never again. */
  const dismissHint = () => {
    setSwipeHint(false);
    try {
      localStorage.setItem("share-swipe-hint", "1");
    } catch {
      /* private mode */
    }
  };


  /** Phones have a native share sheet; everything else copies the link. */
  const shareLink = async () => {
    const url = window.location.href;
    const title = payload?.venture.name ?? "Venture showcase";
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* dismissed */
    }
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
          {isMobile ? (
            /* Phone masthead: one line, sticky, with the one-liner on demand. */
            <header className="shrink-0 border-b border-border/60 bg-card/50 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5 backdrop-blur">
              <div className="flex items-center gap-3">
                {surfaceLogo && (
                  <img
                    src={surfaceLogo}
                    alt={payload.venture.name}
                    className={`shrink-0 rounded-lg object-contain transition-all ${
                      condensed ? "h-8 w-8" : "h-10 w-10"
                    }`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="truncate font-serif text-[17px] leading-tight tracking-tight">
                    {payload.venture.name}
                  </h1>
                  {/* Chapter + position never scroll away, so nobody loses their place. */}
                  <p className="truncate text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
                    {activeIndex >= 0 ? `${activeIndex + 1} / ${items.length}` : `${items.length} assets`}
                    {activeSection ? (
                      <span className="text-primary"> · {activeSection.label}</span>
                    ) : null}
                  </p>
                </div>
                <SectionExportMenu
                  label="Download all"
                  className="h-11 w-11 border-0 bg-primary text-primary-foreground hover:bg-primary/90"
                  build={() => buildFullDoc(payload)}
                />
                {payload.venture.website && (
                  <a
                    href={`https://${payload.venture.website}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Visit website"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              {payload.venture.oneLiner && !condensed && (
                <button
                  type="button"
                  onClick={() => setBlurbOpen((v) => !v)}
                  className="mt-2 w-full text-left text-[13px] leading-relaxed text-muted-foreground"
                >
                  <span className={blurbOpen ? "" : "line-clamp-2"}>{payload.venture.oneLiner}</span>
                  <span className="mt-0.5 block text-[11px] text-primary">
                    {blurbOpen ? "Less" : "More"}
                  </span>
                </button>
              )}
              {/* Progress through the whole set. */}
              <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${items.length ? ((activeIndex + 1) / items.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <CategoryStepper
                sections={payload.sections}
                activeSectionKey={activeSection?.key ?? null}
                onJump={(k) => k && goTo(k)}
              />
            </header>

          ) : (
            /* Masthead — condenses once the reader starts working. */
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

                {surfaceLogo && (
                  <img
                    src={surfaceLogo}
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
                <SectionExportMenu
                  variant="primary"
                  label="Download all"
                  className={`ml-auto shrink-0 ${condensed ? "h-9" : "h-10"}`}
                  build={() => buildFullDoc(payload)}
                />
                {payload.venture.website && (
                  <Button
                    asChild
                    variant="outline"
                    size={condensed ? "sm" : "default"}
                    className="shrink-0"
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
                    className="hidden shrink-0 md:inline-flex"
                    onClick={() => goTo(BRAIN_KEY)}
                  >
                    <Sparkle className="mr-1.5 h-4 w-4" />
                    Ask this venture
                  </Button>
                )}
              </div>
            </header>
          )}


          <div
            className={`mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 gap-12 overflow-hidden ${
              isMobile ? "px-5" : "px-6 md:px-10"
            }`}
          >
            <aside className="hidden w-72 shrink-0 py-8 lg:block">
              <ShareSidebar payload={payload} activeKey={activeKey} onNavigate={goTo} />
            </aside>

            <main
              ref={paneRef}
              onScroll={(e) => setCondensed(e.currentTarget.scrollTop > 24)}
              onTouchStart={isMobile ? onTouchStart : undefined}
              onTouchEnd={isMobile ? onTouchEnd : undefined}
              className={`min-w-0 flex-1 overflow-y-auto ${
                isMobile
                  ? "pb-[calc(env(safe-area-inset-bottom)+96px)] pt-5"
                  : brainActive
                    ? "flex flex-col py-6"
                    : timelineActive
                      ? "pb-16 pt-4"
                      : "pb-24 pt-8"
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
                  {isMobile && opensChapter && activeSection ? (
                    <ChapterCard
                      section={activeSection}
                      activeKey={activeKey}
                      onJump={(k) => goTo(k)}
                    />
                  ) : (
                    activeSection && (
                      <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                        {activeSection.label}
                        {isMobile && posInSection
                          ? ` · ${posInSection} of ${activeSection.items.length}`
                          : ""}
                      </p>
                    )
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
                      exportSlot={
                        <div className="flex items-center gap-1">
                          <SectionExportMenu
                            variant="pill"
                            label="Download"
                            build={() => buildSectionDoc(payload, activeItem)}
                          />
                          {canManage && (
                            <OwnerAssetActions
                              itemKey={activeItem.key}
                              snapshotId={payload.snapshotId!}
                              onChanged={() => void q.refetch()}
                            />
                          )}
                        </div>
                      }
                    />
                  )}
                </>
              )}


              {/* Prev / next keeps the whole set walkable without the sidebar. */}
              {isMobile ? (
                !brainActive && (
                  <>
                    {activeItem && (
                      <SectionExportMenu
                        variant="primary"
                        label="Download this asset"
                        className="mt-6 h-12 w-full rounded-2xl"
                        build={() => buildSectionDoc(payload, activeItem)}
                      />
                    )}
                    {swipeHint && (
                      <button
                        type="button"
                        onClick={dismissHint}
                        className="mt-6 w-full rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-[12px] text-muted-foreground"
                      >
                        Swipe left or tap Next to keep moving through the venture · Dismiss
                      </button>
                    )}
                    <MobilePrevNext
                      prev={prevItem ? { item: prevItem, sectionLabel: prevSection?.label } : null}
                      next={nextItem ? { item: nextItem, sectionLabel: nextSection?.label } : null}
                      nextSection={crossesChapter ? nextSection?.label ?? null : null}
                      chapterDone={
                        crossesChapter && activeSection
                          ? {
                              label: activeSection.label,
                              position: `${activeSection.items.length} of ${activeSection.items.length}`,
                            }
                          : null
                      }
                      onGo={(k) => goTo(k)}
                      onContents={() => setNavOpen(true)}
                    />
                  </>
                )
              ) : (
                <div
                  hidden={brainActive || timelineActive}
                  className="mt-8 flex items-stretch justify-between gap-4 border-t border-border/60 pt-6"
                >
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
              )}


              {!brainActive && (
                <footer className="mt-12 border-t border-border/60 pt-8 text-xs text-muted-foreground">
                  Built with Startup Labs · The 14-Day Pivot Method
                </footer>
              )}
            </main>
          </div>

          {/* Desktop keeps one floating launcher into the Second Brain section. */}
          {brainOn && !brainActive && !isMobile && (
            <button
              type="button"
              onClick={() => goTo(BRAIN_KEY)}
              className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-border/60 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-[1.03]"
            >
              <Sparkle className="h-4 w-4" />
              Ask this venture
            </button>
          )}

          {isMobile && (
            <>
              {/* Thumb-reachable bar: contents, second brain, share, and forward motion. */}
              <MobileBottomBar
                brainOn={brainOn}
                nextTitle={nextItem?.title ?? null}
                onContents={() => setNavOpen(true)}
                onAsk={() => setBrainOpen(true)}
                onShare={() => void shareLink()}
                onNext={() => nextItem && goTo(nextItem.key)}
              />

              <Sheet open={navOpen} onOpenChange={setNavOpen}>
                <SheetContent
                  side="bottom"
                  className="theme-dark-scope flex h-[85dvh] flex-col rounded-t-3xl bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-6"
                >
                  <SheetTitle className="sr-only">Contents</SheetTitle>
                  <ShareSidebar
                    payload={payload}
                    activeKey={activeKey}
                    variant="sheet"
                    viewedKeys={viewed}
                    onNavigate={(k) => {
                      goTo(k);
                      setNavOpen(false);
                    }}
                  />
                </SheetContent>
              </Sheet>

              <Sheet open={brainOpen} onOpenChange={setBrainOpen}>
                <SheetContent
                  side="bottom"
                  className="theme-dark-scope flex h-[100dvh] flex-col rounded-none bg-background px-4 pb-[env(safe-area-inset-bottom)] pt-[calc(env(safe-area-inset-top)+16px)]"
                >
                  <SheetTitle className="sr-only">Second brain</SheetTitle>
                  <ShareBrain
                    token={token}
                    password={submitted}
                    payload={payload}
                    mobile
                    onOpenItem={(k) => {
                      setBrainOpen(false);
                      goTo(k);
                    }}
                    seedQuestion={seedQuestion}
                  />
                  {activeItem && (
                    <button
                      type="button"
                      onClick={() => setBrainOpen(false)}
                      className="mt-2 min-h-[48px] w-full shrink-0 rounded-xl border border-border/60 text-[13px] text-muted-foreground"
                    >
                      Back to {activeItem.title}
                    </button>
                  )}
                </SheetContent>
              </Sheet>

            </>
          )}

          <ShareOutroDialog open={outroOpen} onOpenChange={setOutroOpen} token={token} />

        </div>
      )}


    </div>
  );
}
