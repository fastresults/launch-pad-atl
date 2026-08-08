import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircle, X, Send, Trash2, Mic, Square, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { edgeErrorMessage } from "@/lib/edge-errors";
import { cn } from "@/lib/utils";
import { invokeEdge } from "@/lib/edge-invoke";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "sl.concierge.v2";
const VOICE_PREF_KEY = "sl.concierge.voice.v1";
// "/v" = public venture showcase: it ships its own Second Brain chat, so the
// site concierge would be a second, competing launcher in the same corner.
const HIDDEN_PREFIXES = ["/login", "/signup", "/reset-password", "/unsubscribe", "/dashboard", "/admin", "/welcome", "/paused", "/workshop", "/v"];


const STARTERS = [
  "What actually gets written in the room?",
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
  const [voiceOn, setVoiceOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(VOICE_PREF_KEY) === "1";
  });
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch { /* ignore quota */ }
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem(VOICE_PREF_KEY, voiceOn ? "1" : "0"); } catch { /* noop */ }
  }, [voiceOn]);

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

  useEffect(() => {
    return () => {
      stopAudio();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
    setSpeaking(false);
  }

  const speak = useCallback(async (text: string) => {
    try {
      stopAudio();
      setSpeaking(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL as string;
      const ANON = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/venture-speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ANON,
          Authorization: `Bearer ${token ?? ANON}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[concierge] TTS failed", res.status, detail);
        throw new Error(`TTS ${res.status}`);
      }
      const blob = await res.blob();
      if (!blob.size) throw new Error("Empty audio");
      const url = URL.createObjectURL(blob);
      currentAudioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stopAudio();
      audio.onerror = () => {
        console.error("[concierge] audio element error");
        stopAudio();
      };
      try {
        await audio.play();
      } catch (playErr) {
        console.error("[concierge] audio.play() rejected", playErr);
        stopAudio();
      }
    } catch (err) {
      console.error("[concierge] speak failed", err);
      stopAudio();
    }
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setError(null);
    stopAudio();
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const { data, error: err } = await invokeEdge("venture-chatbot", {
        body: { messages: next },
      });
      if (err) throw err;
      const answer = (data as any)?.answer as string | undefined;
      if (!answer) throw new Error("Empty response");
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      if (voiceOn) void speak(stripMarkdown(answer));
    } catch (e: any) {
      setError(edgeErrorMessage(e, "Couldn't reach the concierge. Please try again."));
    } finally {
      setPending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function startRecording() {
    if (recording || transcribing || pending) return;
    setError(null);
    stopAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const type = recorder.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        chunksRef.current = [];
        if (blob.size < 2048) {
          setError("That recording was empty — please try again.");
          return;
        }
        await transcribeAndSend(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access is needed. Enable it in your browser and try again.");
    }
  }

  function stopRecording() {
    if (!recording) return;
    setRecording(false);
    try { recorderRef.current?.stop(); } catch { /* noop */ }
  }

  async function transcribeAndSend(blob: Blob) {
    setTranscribing(true);
    try {
      const ext = (blob.type.split(";")[0].split("/")[1] || "webm").replace("mpeg", "mp3");
      const form = new FormData();
      form.append("file", new File([blob], `recording.${ext}`, { type: blob.type }));
      const { data, error: err } = await invokeEdge("venture-transcribe", { body: form });
      if (err) throw err;
      const text = ((data as any)?.text ?? "").trim();
      if (!text) {
        setError("Couldn't hear that — please try again.");
        return;
      }
      await send(text);
    } catch (e: any) {
      setError(edgeErrorMessage(e, "Couldn't transcribe that. Please try again."));
    } finally {
      setTranscribing(false);
    }
  }

  function clearAll() {
    setMessages([]);
    setError(null);
    stopAudio();
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
          className="sl-chat-launcher fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-md border border-[#4f73b8] bg-[#628acf] px-4 py-3 text-sm font-medium text-[#FAF8F5] shadow-lg shadow-black/20 transition-transform hover:scale-[1.02] hover:bg-[#4f73b8] active:scale-100 md:bottom-8 md:right-6"
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
            "fixed z-50 flex flex-col overflow-hidden border border-[#E5DDD0] bg-[#FAF8F5] text-[#2B1F14] shadow-2xl",
            // Mobile: bottom sheet full width. Desktop: bottom-right card.
            "inset-x-3 bottom-3 max-h-[85vh] rounded-lg",
            "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-h-[600px]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#6f5a42] bg-[#8B7355] px-4 py-3 text-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-flex size-6 items-center justify-center rounded-full bg-[#FAF8F5]/15 font-serif text-[13px] leading-none text-[#FAF8F5]"
              >
                SL
              </span>
              <div className="font-serif text-base tracking-tight">Startup Labs Concierge</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={voiceOn ? "Voice replies on — click to mute" : "Voice replies off — click to enable"}
                aria-pressed={voiceOn}
                onClick={() => {
                  if (voiceOn && speaking) stopAudio();
                  setVoiceOn((v) => !v);
                }}
                className={cn(
                  "rounded-md p-1.5 text-[#FAF8F5]/80 transition-colors hover:bg-[#FAF8F5]/10 hover:text-[#FAF8F5]",
                  voiceOn && "text-[#FAF8F5]",
                )}
              >
                {voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  aria-label="Clear conversation"
                  onClick={clearAll}
                  className="rounded-md p-1.5 text-[#FAF8F5]/80 transition-colors hover:bg-[#FAF8F5]/10 hover:text-[#FAF8F5]"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-[#FAF8F5]/80 transition-colors hover:bg-[#FAF8F5]/10 hover:text-[#FAF8F5]"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#FAF8F5] px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-between gap-4">
                <div>
                  <p className="text-sm leading-relaxed text-[#2B1F14]">
                    Hey — ask me anything about Startup Labs. What actually gets built in the room, pricing, cohorts, or what to expect.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-sm border border-[#E5DDD0] bg-[#FAF8F5] px-3 py-1.5 text-xs text-[#2B1F14] transition-colors hover:border-[#8B7355] hover:bg-[#F0EBE3]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <MessageBubble
                    key={i}
                    role={m.role}
                    content={m.content}
                    onPlay={m.role === "assistant" ? () => speak(stripMarkdown(m.content)) : undefined}
                    onStop={stopAudio}
                    speaking={speaking}
                  />
                ))}
                {(pending || transcribing || speaking) && (
                  <div className="flex items-center gap-2 text-xs text-[#8B7355]">
                    <span className="inline-flex size-2 animate-pulse rounded-full bg-[#B8532A]" />
                    {transcribing ? "Transcribing…" : speaking ? "Speaking…" : "Thinking…"}
                  </div>
                )}
                {error && (
                  <div className="rounded-md border border-[#B8532A]/40 bg-[#B8532A]/10 px-3 py-2 text-xs text-[#7a3418]">
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
            className="border-t border-[#E5DDD0] bg-[#FAF8F5] p-3"
          >
            <div className="flex items-end gap-2 rounded-md border border-[#E5DDD0] bg-white p-2 focus-within:border-[#8B7355] focus-within:ring-1 focus-within:ring-[#8B7355]/30">
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
                placeholder={recording ? "Listening… tap the square to stop." : "Ask about the workshop, pricing, tracks…"}
                className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[#2B1F14] placeholder:text-[#8B7355]/60 focus:outline-none"
                disabled={pending || recording || transcribing}
              />
              <button
                type="button"
                aria-label={recording ? "Stop recording" : "Record voice message"}
                onClick={recording ? stopRecording : startRecording}
                disabled={pending || transcribing}
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-[#E5DDD0] bg-[#FAF8F5] text-[#2B1F14] transition-colors hover:bg-[#F0EBE3] disabled:opacity-40",
                  recording && "animate-pulse border-[#B8532A]/60 bg-[#B8532A]/15 text-[#7a3418]",
                )}
              >
                {transcribing ? <Loader2 className="size-4 animate-spin" /> : recording ? <Square className="size-4" /> : <Mic className="size-4" />}
              </button>
              <button
                type="submit"
                aria-label="Send"
                disabled={pending || recording || transcribing || !input.trim()}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-[#8B7355] text-[#FAF8F5] transition-colors hover:bg-[#7a6549] disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-tight text-[#8B7355]">
              Answers are AI-generated from our site content. For anything time-sensitive, use{" "}
              <a href="/contact" className="text-[#B8532A] underline-offset-2 hover:underline">/contact</a>.
            </p>
          </form>
        </div>
      )}

    </>
  );
}

function MessageBubble({
  role,
  content,
  onPlay,
  onStop,
  speaking,
}: {
  role: "user" | "assistant";
  content: string;
  onPlay?: () => void;
  onStop?: () => void;
  speaking?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-md rounded-br-sm bg-[#8B7355] px-3.5 py-2 text-sm text-[#FAF8F5]">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-full text-sm text-[#2B1F14]">
      <div className="prose prose-sm max-w-none prose-p:my-2 prose-p:leading-relaxed prose-p:text-[#2B1F14] prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:text-[#2B1F14] prose-a:text-[#B8532A] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#2B1F14] prose-headings:font-serif prose-headings:text-[#2B1F14]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
      {onPlay && (
        <button
          type="button"
          onClick={speaking ? onStop : onPlay}
          className="mt-1 inline-flex items-center gap-1 rounded-sm border border-[#E5DDD0] bg-[#FAF8F5] px-2.5 py-1 text-[11px] text-[#8B7355] transition-colors hover:border-[#8B7355] hover:bg-[#F0EBE3] hover:text-[#2B1F14]"
          aria-label={speaking ? "Stop playback" : "Listen to this reply"}
        >
          {speaking ? <Square className="size-3" /> : <Volume2 className="size-3" />}
          {speaking ? "Stop" : "Listen"}
        </button>
      )}
    </div>
  );
}

// Strip markdown syntax so TTS reads clean prose (no asterisks, hashes, link syntax).
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Pick a MediaRecorder MIME the browser supports. Safari records audio/mp4;
// Chrome/Firefox default to audio/webm.
function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch { /* noop */ }
  }
  return undefined;
}
