import { useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, Send, Square, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownProse } from "@/components/markdown/MarkdownProse";
import { askShareChat, type ShareChatMessage } from "@/lib/venture-share.functions";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://hflfxytqrlkobhuugsca.supabase.co";

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
}: {
  token: string;
  password?: string;
  ventureName: string;
  /** Render inline (fills its parent) instead of as a floating dock. */
  embedded?: boolean;
  hideHeader?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ShareChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

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

  return (
    <div
      className={
        embedded
          ? "flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60"
          : "fixed bottom-4 right-4 z-40 flex h-[min(70vh,560px)] w-[min(92vw,420px)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
      }
    >
      {!hideHeader && (
      <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">Ask about {ventureName}</p>
          <p className="text-[11px] text-muted-foreground">Answers come from this venture's own assets</p>
        </div>
        {!embedded && (
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chat">
            <X className="h-4 w-4" />
          </Button>
        )}
      </header>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!messages.length && (
          <p className="text-sm text-muted-foreground">
            Ask anything — the model, the plan, the numbers, the next 14 days.
          </p>
        )}


        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-3.5 py-2.5 text-sm text-primary-foreground"
                : "max-w-full rounded-2xl bg-muted/40 px-3.5 py-2.5"
            }
          >
            {m.role === "user" ? m.content : <MarkdownProse className="text-sm">{m.content}</MarkdownProse>}
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Starter chips sit with the input, and disappear after the first ask. */}
      {!messages.length && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-border/60 px-3 pt-3">
          {["What problem does this solve?", "How does it make money?", "What happens in the first 14 days?"].map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="shrink-0 rounded-full border border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {s}
              </button>
            ),
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className={`flex shrink-0 items-end gap-2 p-3 ${messages.length ? "border-t border-border/60" : ""}`}
      >

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder={recording ? "Listening…" : "Type your question"}
          className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
        />
        <Button
          type="button"
          variant={recording ? "destructive" : "outline"}
          size="icon"
          onClick={() => void toggleRecording()}
          aria-label={recording ? "Stop recording" : "Ask by voice"}
        >
          {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send question">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
