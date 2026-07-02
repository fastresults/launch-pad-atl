import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircle, X, Send, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { edgeErrorMessage } from "@/lib/edge-errors";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "sl.concierge.v1";
const HIDDEN_PREFIXES = ["/login", "/signup", "/reset-password", "/unsubscribe", "/dashboard", "/admin", "/welcome", "/paused", "/workshop"];

const STARTERS = [
  "What do I leave with?",
  "How much is it?",
  "When's the next cohort?",
  "Is this right for me?",
];

function loadMessages(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((m: any) => m?.role && typeof m?.content === "string") : [];
  } catch {
    return [];
  }
}

export function AskConcierge() {
  const { pathname } = useLocation();
  const shouldHide = useMemo(
    () => HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")),
    [pathname],
  );

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch { /* ignore quota */ }
  }, [messages]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const { data, error: err } = await supabase.functions.invoke("venture-chatbot", {
        body: { messages: next },
      });
      if (err) throw err;
      const answer = (data as any)?.answer as string | undefined;
      if (!answer) throw new Error("Empty response");
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (e: any) {
      setError(edgeErrorMessage(e, "Couldn't reach the concierge. Please try again."));
    } finally {
      setPending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function clearAll() {
    setMessages([]);
    setError(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }

  if (shouldHide) return null;

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          aria-label="Ask Startup Labs"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-hero-gradient px-4 py-3 text-sm font-medium text-white shadow-elegant shadow-primary/30 ring-1 ring-white/10 transition-transform hover:scale-[1.02] active:scale-100 md:bottom-6 md:right-6"
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline">Ask Startup Labs</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Startup Labs Concierge"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border border-white/10 bg-background shadow-2xl",
            // Mobile: bottom sheet full width. Desktop: bottom-right card.
            "inset-x-3 bottom-3 max-h-[85vh] rounded-2xl",
            "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-h-[600px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-hero-gradient px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <div className="text-sm font-semibold tracking-tight">Startup Labs Concierge</div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  aria-label="Clear conversation"
                  onClick={clearAll}
                  className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">
                    Hey — ask me anything about Startup Labs. The workshop, the 34 startup assets, pricing, cohorts, or what to expect.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <MessageBubble key={i} role={m.role} content={m.content} />
                ))}
                {pending && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex size-2 animate-pulse rounded-full bg-primary" />
                    Thinking…
                  </div>
                )}
                {error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-white/10 bg-background p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 focus-within:border-primary/50">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about the workshop, pricing, tracks…"
                className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                disabled={pending}
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={pending || !input.trim()}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-tight text-muted-foreground">
              Answers are AI-generated from our site content. For anything time-sensitive, use{" "}
              <a href="/contact" className="underline hover:text-foreground">/contact</a>.
            </p>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-full text-sm text-foreground">
      <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
