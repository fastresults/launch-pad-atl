import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDocumentTitle } from "@/lib/use-document-title";
import { fetchSharePayload, trackShareView, type SharePayload } from "@/lib/venture-share.functions";
import { ShareSidebar } from "@/components/share/ShareSidebar";
import { ShareSection } from "@/components/share/ShareSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Loader2, Lock, Menu } from "lucide-react";

export default function VentureSharePage() {
  const { token = "" } = useParams();
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState<string | undefined>(undefined);
  const [activeKey, setActiveKey] = useState<string | null>(null);
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
    const fromHash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const initial = items.find((i) => i.key === fromHash)?.key ?? items[0].key;
    setActiveKey((prev) => prev ?? initial);
  }, [items]);

  const activeIndex = items.findIndex((i) => i.key === activeKey);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;
  const activeSection = payload?.sections.find((s) => s.items.some((i) => i.key === activeKey));

  const goTo = (key: string) => {
    setActiveKey(key);
    history.replaceState(null, "", `#${key}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            <h1 className="font-serif text-3xl tracking-tight">Link unavailable</h1>
            <p className="mt-3 text-sm text-muted-foreground">{err?.message}</p>
          </div>
        </div>
      )}

      {payload && (
        <>
          {/* Masthead */}
          <header className="border-b border-border/60 bg-gradient-to-b from-card/70 to-background">
            <div className="mx-auto flex max-w-[1400px] items-center gap-5 px-6 py-8 md:px-10 md:py-12">
              <Sheet open={navOpen} onOpenChange={setNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open contents">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="theme-dark-scope w-[85vw] max-w-xs overflow-y-auto bg-background p-6">
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
                  className="h-12 w-12 shrink-0 rounded-lg object-contain md:h-16 md:w-16"
                />
              )}
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Venture showcase · {items.length} assets
                </p>
                <h1 className="mt-1 truncate font-serif text-[26px] leading-tight tracking-tight md:text-[40px]">
                  {payload.venture.name}
                </h1>
                {payload.venture.oneLiner && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {payload.venture.oneLiner}
                  </p>
                )}
              </div>
            </div>
          </header>

          <div className="mx-auto flex max-w-[1400px] gap-12 px-6 md:px-10">
            <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto py-10 lg:block">
              <ShareSidebar payload={payload} activeKey={activeKey} onNavigate={goTo} />
            </aside>

            <main className="min-w-0 flex-1 pb-32 pt-10">
              {activeSection && (
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                  {activeSection.label}
                </p>
              )}
              {activeItem && <ShareSection item={activeItem} />}

              {/* Prev / next keeps the whole set walkable without the sidebar. */}
              <div className="mt-8 flex items-stretch justify-between gap-4 border-t border-border/60 pt-6">
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

              <footer className="mt-12 border-t border-border/60 pt-8 text-xs text-muted-foreground">
                Built with Startup Labs · The 14-Day Pivot Method
              </footer>
            </main>
          </div>

        </>
      )}
    </div>
  );
}
