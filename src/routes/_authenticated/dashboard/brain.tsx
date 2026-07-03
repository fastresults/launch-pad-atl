// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Brain, Send, Mic, Square, Volume2, VolumeX, Loader2, RefreshCw, StickyNote,
  Sparkles, Trash2, FileText, ChevronDown, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  loadBrainHistory, sendBrainMessage, clearBrainHistory, rebuildBrainMemory,
  saveBrainNote, listBrainNotes, deleteBrainNote, getBrainStatus,
  type BrainMessage,
} from "@/lib/brain.functions";

const STARTERS = [
  "What's the single riskiest assumption in my plan?",
  "Summarize what's ready and what's still weak.",
  "What should I do this week?",
  "Which asset scored lowest — and why?",
];

function stripMarkdown(s: string) {
  return s.replace(/[#*_>`~[\]()]/g, "").replace(/\n{2,}/g, ". ").trim();
}

export default function BrainPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: history = [] } = useQuery({
    queryKey: ["brain", "history", userId],
    queryFn: () => loadBrainHistory(userId!),
    enabled: !!userId,
  });
  const { data: status } = useQuery({
    queryKey: ["brain", "status", userId],
    queryFn: () => getBrainStatus(userId!),
    enabled: !!userId,
    refetchInterval: 15000,
  });
  const { data: notes = [] } = useQuery({
    queryKey: ["brain", "notes", userId],
    queryFn: () => listBrainNotes(userId!),
    enabled: !!userId,
  });

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, pending]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (!pending) inputRef.current?.focus(); }, [pending]);

  useEffect(() => () => {
    stopAudio();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    setSpeaking(false);
  }

  const speak = useCallback(async (text: string) => {
    try {
      stopAudio();
      setSpeaking(true);
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
      const ANON = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/venture-speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${token ?? ANON}` },
        body: JSON.stringify({ text: text.slice(0, 2000) }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => stopAudio();
      a.onerror = () => stopAudio();
      await a.play();
    } catch (e) {
      console.error(e);
      stopAudio();
    }
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending || !userId) return;
    stopAudio();
    setInput("");
    setPending(true);
    // Optimistic user message
    qc.setQueryData<BrainMessage[]>(["brain", "history", userId], (prev = []) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: "user", content: trimmed, citations: [], created_at: new Date().toISOString() },
    ]);
    try {
      const { answer, citations } = await sendBrainMessage(trimmed);
      qc.setQueryData<BrainMessage[]>(["brain", "history", userId], (prev = []) => [
        ...prev,
        { id: `tmp-a-${Date.now()}`, role: "assistant", content: answer, citations, created_at: new Date().toISOString() },
      ]);
      qc.invalidateQueries({ queryKey: ["brain", "history", userId] });
      if (voiceOn) void speak(stripMarkdown(answer));
    } catch (e: any) {
      toast.error(e?.message ?? "Chat failed");
    } finally {
      setPending(false);
    }
  }, [pending, qc, userId, voiceOn, speak]);

  const rebuild = useMutation({
    mutationFn: rebuildBrainMemory,
    onSuccess: (r) => {
      toast.success(`Memory rebuilt — ${r.chunks} chunks from ${r.sources} sources`);
      qc.invalidateQueries({ queryKey: ["brain", "status", userId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Rebuild failed"),
  });

  const clearChat = useMutation({
    mutationFn: () => clearBrainHistory(userId!),
    onSuccess: () => {
      qc.setQueryData(["brain", "history", userId], []);
      toast.success("Cleared");
    },
  });

  async function startRecording() {
    if (recording || transcribing || pending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        chunksRef.current = [];
        if (blob.size < 2048) { toast.info("Recording too short"); return; }
        await transcribeAndSend(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone unavailable");
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
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const b64 = btoa(bin);
      const { data, error } = await supabase.functions.invoke("venture-transcribe", {
        body: { audio_base64: b64, mime_type: blob.type },
      });
      if (error) throw error;
      const text = ((data as any)?.text ?? "").trim();
      if (!text) { toast.info("Couldn't hear that"); return; }
      await send(text);
    } catch (e: any) {
      toast.error(e?.message ?? "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  }

  async function saveLastAsNote() {
    if (!userId) return;
    const lastAssistant = [...history].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) { toast.info("No answer to save yet"); return; }
    try {
      await saveBrainNote(userId, lastAssistant.content, "chat");
      toast.success("Saved as note");
      qc.invalidateQueries({ queryKey: ["brain", "notes", userId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  }

  async function addManualNote() {
    if (!userId) return;
    const text = window.prompt("Note (this becomes part of your brain memory next rebuild):");
    if (!text?.trim()) return;
    await saveBrainNote(userId, text, "text");
    toast.success("Note saved. Rebuild memory to embed it.");
    qc.invalidateQueries({ queryKey: ["brain", "notes", userId] });
  }

  const empty = history.length === 0;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
      {/* Left: status + notes */}
      <aside className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="h-4 w-4 text-primary" /> Brain status
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Assets" value={`${status?.generated ?? 0}/${status?.totalAssets ?? 0}`} />
            <Stat label="Assessments" value={String(status?.assessed ?? 0)} />
            <Stat label="Hero images" value={String(status?.heroReady ?? 0)} />
            <Stat label="Notes" value={String(status?.notes ?? 0)} />
            <Stat label="Memory chunks" value={String(status?.memoryChunks ?? 0)} className="col-span-2" />
          </div>
          <Button
            size="sm" variant="outline" className="mt-3 w-full"
            onClick={() => rebuild.mutate()}
            disabled={rebuild.isPending}
          >
            {rebuild.isPending
              ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Rebuilding…</>
              : <><RefreshCw className="mr-2 h-3 w-3" />Rebuild memory</>}
          </Button>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            Re-embed your brief, startup assets, assessments, and notes so the brain retrieves the latest of everything.
          </p>
        </Card>

        <Card className="p-4">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold"
          >
            <span className="flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notes ({notes.length})</span>
            {showNotes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <Button size="sm" variant="ghost" className="mt-2 w-full justify-start" onClick={addManualNote}>
            + Add a note
          </Button>
          {showNotes && (
            <ul className="mt-2 space-y-2 max-h-72 overflow-y-auto">
              {notes.length === 0 && <li className="text-xs text-muted-foreground">No notes yet.</li>}
              {notes.map((n: any) => (
                <li key={n.id} className="rounded border border-border/60 bg-background/40 p-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-3 whitespace-pre-wrap">{n.content}</span>
                    <button
                      onClick={async () => {
                        await deleteBrainNote(n.id);
                        qc.invalidateQueries({ queryKey: ["brain", "notes", userId] });
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="h-4 px-1 text-[9px]">{n.source}</Badge>
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>

      {/* Right: chat */}
      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-border/60 bg-card">
        <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-semibold">Second Brain</div>
              <div className="text-[11px] text-muted-foreground">Voice + text control of your startup context</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { if (voiceOn && speaking) stopAudio(); setVoiceOn((v) => !v); }}
              className={cn(
                "rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
                voiceOn && "text-primary",
              )}
              aria-label={voiceOn ? "Mute replies" : "Speak replies"}
            >
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => clearChat.mutate()}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {empty ? (
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Ask anything about your startup — brief, assets, assessments, notes. I'll cite what I used.
                </p>
                <p className="text-xs text-muted-foreground">
                  Tip: rebuild memory after generating new assets so I have the latest.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            history.map((m) => <BubbleMsg key={m.id} m={m} onSpeak={voiceOn ? speak : undefined} />)
          )}
          {(pending || transcribing || speaking) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {transcribing ? "Transcribing…" : speaking ? "Speaking…" : "Thinking…"}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="border-t border-border/60 p-3"
        >
          <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-background/40 p-2 focus-within:border-primary/60">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder={recording ? "Listening… tap the square to send" : "Ask, or press the mic to speak"}
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm focus:outline-none"
              disabled={pending || recording || transcribing}
            />
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={pending || transcribing}
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-foreground hover:bg-muted disabled:opacity-40",
                recording && "border-destructive/60 bg-destructive/20 text-destructive animate-pulse",
              )}
              aria-label={recording ? "Stop" : "Record"}
            >
              {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              type="submit"
              disabled={pending || recording || transcribing || !input.trim()}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Grounded in your own brief, assets, and notes.</span>
            <button type="button" onClick={saveLastAsNote} className="inline-flex items-center gap-1 hover:text-foreground">
              <Sparkles className="h-3 w-3" /> Save last answer as note
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded border border-border/60 bg-background/40 px-2 py-1.5", className)}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function BubbleMsg({ m, onSpeak }: { m: BrainMessage; onSpeak?: (t: string) => void }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground whitespace-pre-wrap">
          {m.content}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-full text-sm text-foreground">
      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5 prose-strong:text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
      </div>
      {m.citations?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {m.citations.map((c) => (
            <Badge key={c.n} variant="outline" className="gap-1 text-[10px] font-normal">
              <FileText className="h-3 w-3" /> [{c.n}] {c.title}
            </Badge>
          ))}
        </div>
      )}
      {onSpeak && (
        <button
          type="button"
          onClick={() => onSpeak(stripMarkdown(m.content))}
          className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Volume2 className="h-3 w-3" /> Play
        </button>
      )}
    </div>
  );
}
