import { useEffect, useRef, useState } from "react";
import { Brain, MessageCircle, Mic, Send, Square, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MarkdownProse } from "@/components/markdown/MarkdownProse";
import { askShareChat, type ShareChatMessage } from "@/lib/venture-share.functions";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://hflfxytqrlkobhuugsca.supabase.co";

/** Visitor-facing openers, mirroring the internal brain's starter chips. */
const STARTERS = [
  "What is this business?",
  "What's the offer and pricing?",
  "What's already built?",
  "What happens in the first 30 days?",
];

/**
 * "Ask anything" dock on the public showcase. Answers come from the venture's
 * own assets via the token-scoped venture-share-chat endpoint; questions can be
 * typed or spoken.
 */
export function ShareChatPanel({
  token,
  password,
  ventureName,
  embedded = false,
  hideHeader = false,
  seedQuestion,
  onInteract,
}: {
  token: string;
  password?: string;
  ventureName: string;
  /** Render inline (fills its parent) instead of as a floating dock. */
  embedded?: boolean;
  hideHeader?: boolean;
  /** Pre-fills the input — used when a timeline step hands over a question. */
  seedQuestion?: string | null;
  /** Fired on the first sign of visitor intent (focus, typing, send, voice). */
  onInteract?: () => void;
}) {


  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ShareChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Embedded in the showcase the panel is the point of the screen — focus it.
  useEffect(() => {
    if (embedded && window.matchMedia("(min-width: 1024px)").matches) inputRef.current?.focus();
  }, [embedded]);

  // A question handed over from a timeline step lands in the box, ready to send.
  useEffect(() => {
    if (!seedQuestion) return;
    setInput(seedQuestion);
    setOpen(true);
    inputRef.current?.focus();
  }, [seedQuestion]);




  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setError(null);
    setBusy(true);
    try {
      const reply = await askShareChat(token, next, password);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 1024) return;
        setBusy(true);
        try {
          const form = new FormData();
          form.append("file", blob, "question.webm");
          const res = await fetch(`${SUPABASE_URL}/functions/v1/venture-transcribe`, {
            method: "POST",
            body: form,
          });
          const data = await res.json().catch(() => ({}));
          setBusy(false);
          if (!res.ok || !data?.text) {
            setError(data?.error ?? "Couldn't hear that — try again.");
            return;
          }
          await send(String(data.text));
        } catch {
          setBusy(false);
          setError("Couldn't transcribe that recording.");
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      setError("Microphone access was blocked.");
    }
  }

  if (!embedded && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-border/60 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-[1.03]"
      >
        <MessageCircle className="h-4 w-4" />
        Ask about this venture
      </button>
    );
  }

  const empty = !messages.length;

  return (
    <div
      className={
        embedded
          ? "flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card"
          : "fixed bottom-4 right-4 z-40 flex h-[min(70vh,560px)] w-[min(92vw,420px)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
      }
    >
      {!hideHeader && (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Brain className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">Second Brain</div>
              <div className="truncate text-[11px] text-muted-foreground">
                Answers come from {ventureName}'s own assets
              </div>
            </div>
          </div>
          {!embedded && (
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </Button>
          )}
        </header>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {empty ? (
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Ask anything about this venture — the model, the offer, the numbers, the next 30 days.
              </p>
              <p className="text-xs text-muted-foreground">
                Every answer is grounded in the assets shared on this page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onInteract?.();
                    void send(s);
                  }}
                  className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="max-w-full text-sm text-foreground">
                <MarkdownProse className="text-sm">{m.content}</MarkdownProse>
              </div>
            ),
          )
        )}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onInteract?.();
          void send(input);
        }}
        className="shrink-0 border-t border-border/60 p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-background/40 p-2 focus-within:border-primary/60">
          <textarea
            ref={inputRef}
            value={input}
            onFocus={() => onInteract?.()}
            onChange={(e) => {
              onInteract?.();
              setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onInteract?.();
                void send(input);
              }
            }}
            rows={1}
            placeholder={recording ? "Listening… tap the square to send" : "Ask, or press the mic to speak"}
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm focus:outline-none"
            disabled={busy || recording}
          />
          <button
            type="button"
            onClick={() => {
              onInteract?.();
              void toggleRecording();
            }}
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-foreground hover:bg-muted disabled:opacity-40",
              recording && "animate-pulse border-destructive/60 bg-destructive/20 text-destructive",
            )}
            aria-label={recording ? "Stop recording" : "Ask by voice"}
          >
            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            type="submit"
            disabled={busy || recording || !input.trim()}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Grounded in this venture's brief, strategy, and finished assets.
        </p>
      </form>
    </div>
  );
}

