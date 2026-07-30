// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Brain, Send, Mic, Square, Volume2, VolumeX, Loader2, RefreshCw, StickyNote,
  Sparkles, Trash2, FileText, ChevronDown, ChevronRight, MessageSquare, Network,
} from "lucide-react";
import BrainMindMap from "@/components/brain/BrainMindMap";
import BrainMaterials from "@/components/brain/BrainMaterials";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  loadBrainHistory, sendBrainMessage, clearBrainHistory, rebuildBrainMemory,
  saveBrainNote, listBrainNotes, deleteBrainNote, getBrainStatus, formatContentAsNote,
  pollBrainJob, getLatestBrainJob, purgeGeneratedAssets, detectVentureMismatch,
  listBrainVentures,
  type BrainMessage, type BrainIndexingJob, type BrainVenture,
} from "@/lib/brain.functions";
import { useConfirm, usePrompt } from "@/components/ui/confirm-dialog";
import { getImpersonationTarget } from "@/lib/effective-user";


const STARTERS = [
  "What's the single riskiest assumption in my plan?",
  "Summarize what's ready and what's still weak.",
  "What should I do this week?",
  "Which asset scored lowest — and why?",
];

function stripMarkdown(s: string) {
  return s.replace(/[#*_>`~[\]()]/g, "").replace(/\n{2,}/g, ". ").trim();
}

const VENTURE_STORAGE_KEY = "brain:selectedSnapshot";

export default function BrainPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;
  const confirm = useConfirm();
  const prompt = usePrompt();

  const { data: ventures = [] } = useQuery({
    queryKey: ["brain", "ventures", userId],
    queryFn: () => listBrainVentures(userId!),
    enabled: !!userId,
  });

  const [snapshotId, setSnapshotId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(VENTURE_STORAGE_KEY);
  });

  // Auto-select the most recent venture the first time we see the list.
  useEffect(() => {
    if (!ventures.length) return;
    const stillValid = snapshotId && ventures.some((v) => v.id === snapshotId);
    if (!stillValid) {
      const next = ventures[0].id;
      setSnapshotId(next);
      try { window.localStorage.setItem(VENTURE_STORAGE_KEY, next); } catch { /* noop */ }
    }
  }, [ventures, snapshotId]);

  const selectVenture = useCallback((id: string | null) => {
    setSnapshotId(id);
    try {
      if (id) window.localStorage.setItem(VENTURE_STORAGE_KEY, id);
      else window.localStorage.removeItem(VENTURE_STORAGE_KEY);
    } catch { /* noop */ }
    qc.invalidateQueries({ queryKey: ["brain"] });
  }, [qc]);

  const currentVenture = useMemo(
    () => ventures.find((v) => v.id === snapshotId) ?? null,
    [ventures, snapshotId],
  );

  const { data: history = [] } = useQuery({
    queryKey: ["brain", "history", userId, snapshotId],
    queryFn: () => loadBrainHistory(userId!, snapshotId),
    enabled: !!userId,
  });
  const { data: status } = useQuery({
    queryKey: ["brain", "status", userId, snapshotId],
    queryFn: () => getBrainStatus(userId!, snapshotId),
    enabled: !!userId,
    refetchInterval: 15000,
  });
  const { data: notes = [] } = useQuery({
    queryKey: ["brain", "notes", userId, snapshotId],
    queryFn: () => listBrainNotes(userId!, snapshotId),
    enabled: !!userId,
  });
  const { data: mismatch } = useQuery({
    queryKey: ["brain", "mismatch", userId, snapshotId],
    queryFn: () => detectVentureMismatch(userId!, snapshotId),
    enabled: !!userId && !!snapshotId,
    refetchInterval: 30000,
  });

  const [input, setInput] = useState("");
  const [view, setView] = useState<"chat" | "map">("chat");
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
    qc.setQueryData<BrainMessage[]>(["brain", "history", userId, snapshotId], (prev = []) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: "user", content: trimmed, citations: [], created_at: new Date().toISOString() },
    ]);
    try {
      const { answer, citations } = await sendBrainMessage(trimmed, snapshotId);
      qc.setQueryData<BrainMessage[]>(["brain", "history", userId, snapshotId], (prev = []) => [
        ...prev,
        { id: `tmp-a-${Date.now()}`, role: "assistant", content: answer, citations, created_at: new Date().toISOString() },
      ]);
      qc.invalidateQueries({ queryKey: ["brain", "history", userId, snapshotId] });
      if (voiceOn) void speak(stripMarkdown(answer));
    } catch (e: any) {
      toast.error(e?.message ?? "Chat failed");
    } finally {
      setPending(false);
    }
  }, [pending, qc, userId, snapshotId, voiceOn, speak]);

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<BrainIndexingJob | null>(null);

  // On mount / user change, pick up any in-flight job so a page refresh doesn't lose progress.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void getLatestBrainJob(userId, snapshotId).then((j) => {
      if (cancelled) return;
      setJob(j);
      if (j && (j.status === "queued" || j.status === "running")) setJobId(j.id);
      else setJobId(null);
    });
    return () => { cancelled = true; };
  }, [userId, snapshotId]);

  // Poll the active job.
  useEffect(() => {
    if (!jobId) return;
    let stop = false;
    const tick = async () => {
      try {
        const j = await pollBrainJob(jobId);
        if (stop) return;
        setJob(j);
        if (j.status === "done" || j.status === "failed") {
          setJobId(null);
          qc.invalidateQueries({ queryKey: ["brain", "status", userId, snapshotId] });
          qc.invalidateQueries({ queryKey: ["brain", "mismatch", userId, snapshotId] });
          qc.invalidateQueries({ queryKey: ["brain-graph"] });
          if (j.status === "done") {
            toast.success(`Memory ready — ${j.embedded_chunks} chunks from ${j.total_sources} sources${j.failed_chunks ? ` (${j.failed_chunks} failed)` : ""}`);
          } else {
            toast.error(j.error_message ?? "Rebuild failed");
          }
        }
      } catch {
        // keep polling; transient network errors shouldn't abort
      }
    };
    void tick();
    const iv = setInterval(tick, 2000);
    return () => { stop = true; clearInterval(iv); };
  }, [jobId, qc, userId, snapshotId]);

  const rebuild = useMutation({
    mutationFn: () => rebuildBrainMemory(snapshotId, userId),
    onSuccess: ({ jobId: id }) => {
      setJobId(id);
      setJob({
        id, status: "queued", total_sources: 0, total_chunks: 0, embedded_chunks: 0,
        failed_chunks: 0, error_message: null, started_at: null, finished_at: null,
        created_at: new Date().toISOString(),
      });
      toast.info("Rebuilding memory in the background…");
    },
    onError: (e: any) => toast.error(e?.message ?? "Rebuild failed"),
  });

  const clearChat = useMutation({
    mutationFn: () => clearBrainHistory(userId!, snapshotId),
    onSuccess: () => {
      qc.setQueryData(["brain", "history", userId, snapshotId], []);
      toast.success("Cleared");
    },
  });

  const purge = useMutation({
    mutationFn: () => purgeGeneratedAssets(userId!, snapshotId),
    onSuccess: (res) => {
      const cleared = [
        `${res.memory_chunks_deleted} memory chunks`,
        res.notes_deleted != null ? `${res.notes_deleted} notes` : null,
        res.messages_deleted != null ? `${res.messages_deleted} chat messages` : null,
      ].filter(Boolean).join(", ");
      toast.success(`Reset Second Brain for this startup: ${cleared}. Rebuild memory when ready.`);
      qc.invalidateQueries({ queryKey: ["brain", "status", userId, snapshotId] });
      qc.invalidateQueries({ queryKey: ["brain", "mismatch", userId, snapshotId] });
      qc.invalidateQueries({ queryKey: ["brain", "history", userId, snapshotId] });
      qc.invalidateQueries({ queryKey: ["brain", "notes", userId, snapshotId] });
      qc.invalidateQueries({ queryKey: ["brain-graph"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Reset failed"),
  });

  async function confirmPurge() {
    const scope = currentVenture ? `“${currentVenture.company_name}”` : "this startup";
    const ok = await confirm({
      title: "Reset Second Brain?",
      description: `This resets Second Brain memory, notes, chat, and indexing jobs for ${scope}. Your generated startup assets stay in place.`,
      confirmText: "Reset",
      destructive: true,
    });
    if (ok) purge.mutate();
  }

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
      const ext = (blob.type.split(";")[0].split("/")[1] || "webm").replace("mpeg", "mp3");
      const form = new FormData();
      form.append("file", new File([blob], `recording.${ext}`, { type: blob.type }));
      const { data, error } = await supabase.functions.invoke("venture-transcribe", { body: form });
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
    const idx = [...history].map((m, i) => ({ m, i })).reverse().find(({ m }) => m.role === "assistant");
    if (!idx) { toast.info("No answer to save yet"); return; }
    await saveMessageAsNote(idx.m.content, idx.m.id);
  }

  async function addManualNote() {
    if (!userId) return;
    const text = await prompt({
      title: "Add a note",
      description: "This becomes part of your brain memory next rebuild.",
      placeholder: "Type your note…",
      multiline: true,
      required: true,
      confirmText: "Save note",
    });
    if (!text?.trim()) return;
    const tid = toast.loading("Formatting note…");
    try {
      const body = await formatContentAsNote(text);
      await saveBrainNote(userId, body, snapshotId, "text");
      toast.success("Note saved. Rebuild memory to embed it.", { id: tid });
      qc.invalidateQueries({ queryKey: ["brain", "notes", userId, snapshotId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed", { id: tid });
    }
  }

  async function saveMessageAsNote(content: string, messageId?: string) {
    if (!userId || !content.trim()) return;
    // Grab the user turn that immediately preceded this assistant answer
    // so the summarizer has the question for better titles.
    let question = "";
    if (messageId) {
      const i = history.findIndex((m) => m.id === messageId);
      for (let k = i - 1; k >= 0; k--) {
        if (history[k].role === "user") { question = history[k].content; break; }
      }
    }
    const tid = toast.loading("Summarizing into a note…");
    try {
      const body = await formatContentAsNote(content, question);
      await saveBrainNote(userId, body, snapshotId, "chat");
      toast.success("Saved as note", { id: tid });
      qc.invalidateQueries({ queryKey: ["brain", "notes", userId, snapshotId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed", { id: tid });
    }
  }

  const empty = history.length === 0;
  const assetsReadyWithoutMemory = (status?.generated ?? 0) > 0 && (status?.memoryChunks ?? 0) === 0;

  const viewingAs = getImpersonationTarget();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
      {viewingAs && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-xs text-muted-foreground lg:col-span-2">
          Viewing as <span className="font-semibold text-foreground">{viewingAs.email ?? viewingAs.name ?? viewingAs.userId}</span>
          {" "}— anything you add here lands in their brain.
        </div>
      )}

      {/* Left: status + notes */}
      <aside className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Venture
          </div>
          {ventures.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              No ventures yet. Create one from the Workflow to organize memory here.
            </p>
          ) : (
            <>
              <select
                value={snapshotId ?? ""}
                onChange={(e) => selectVenture(e.target.value || null)}
                className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
              >
                {ventures.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.company_name || "Untitled venture"}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                Chat, notes, and memory below are scoped to <b>{currentVenture?.company_name ?? "this venture"}</b>. Switch to isolate different projects.
              </p>
            </>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="h-4 w-4 text-primary" /> Brain status
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Assets" value={`${status?.generated ?? 0}/${status?.totalAssets ?? 0}`} />
            <Stat label="Assessments" value={String(status?.assessed ?? 0)} />
            <Stat label="Hero images" value={String(status?.heroReady ?? 0)} />
            <Stat label="Notes" value={String(status?.notes ?? 0)} />
            <Stat label="Materials" value={String(status?.materials ?? 0)} />
            <Stat label="Memory chunks" value={String(status?.memoryChunks ?? 0)} className="col-span-2" />
          </div>
          <Button
            size="sm" variant="outline" className="mt-3 w-full"
            onClick={() => rebuild.mutate()}
            disabled={rebuild.isPending || !!jobId}
          >
            {rebuild.isPending || jobId
              ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Rebuilding…</>
              : <><RefreshCw className="mr-2 h-3 w-3" />Rebuild memory</>}
          </Button>
          {job && (job.status === "queued" || job.status === "running") && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${job.total_chunks ? Math.min(100, Math.round(((job.embedded_chunks + job.failed_chunks) / job.total_chunks) * 100)) : 5}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {job.total_chunks
                  ? `Embedding ${job.embedded_chunks + job.failed_chunks} / ${job.total_chunks} chunks`
                  : "Preparing sources…"}
              </p>
            </div>
          )}
          {job?.status === "failed" && (
            <p className="mt-2 text-[10px] text-destructive">{job.error_message ?? "Rebuild failed"}</p>
          )}
          {assetsReadyWithoutMemory && !jobId && (
            <p className="mt-2 rounded border border-primary/20 bg-primary/5 px-2 py-1.5 text-[10px] leading-snug text-primary">
              Your {status?.generated} startup assets are ready, but Second Brain memory has not been built yet. Click Rebuild memory.
            </p>
          )}
          {mismatch?.mismatch && (
            <div className="mt-2 rounded border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[10px] leading-snug text-destructive">
              <p className="font-semibold">Stale content detected</p>
              <p className="mt-0.5">
                Your Second Brain contains legacy assets from a previous startup
                {mismatch.currentCompany ? <> — current startup is <b>{mismatch.currentCompany}</b></> : null}.
                Reset Second Brain memory, then rebuild it for the current startup.
              </p>
              {mismatch.staleTitles?.length ? (
                <p className="mt-1 opacity-80">e.g. {mismatch.staleTitles.slice(0, 2).join(" · ")}</p>
              ) : null}
            </div>
          )}
          <Button
            size="sm" variant="ghost"
            className="mt-2 w-full text-[11px] text-muted-foreground hover:text-destructive"
            onClick={confirmPurge}
            disabled={purge.isPending}
          >
            {purge.isPending
              ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Resetting…</>
              : <><Trash2 className="mr-2 h-3 w-3" />Reset Second Brain</>}
          </Button>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            Re-embed your brief, startup assets, assessments, and notes so the brain retrieves the latest of everything.
          </p>
        </Card>

        {userId && <BrainMaterials userId={userId} snapshotId={snapshotId} />}

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
            <ul className="mt-2 space-y-2 max-h-80 overflow-y-auto pr-1">
              {notes.length === 0 && <li className="text-xs text-muted-foreground">No notes yet.</li>}
              {notes.map((n: any) => <NoteCard key={n.id} note={n} onDelete={async () => {
                await deleteBrainNote(n.id);
                qc.invalidateQueries({ queryKey: ["brain", "notes", userId, snapshotId] });
              }} />)}
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
          <div className="flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-lg border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setView("chat")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 transition-colors",
                  view === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Chat
              </button>
              <button
                type="button"
                onClick={() => setView("map")}
                className={cn(
                  "inline-flex items-center gap-1.5 border-l border-border/60 px-2.5 py-1 transition-colors",
                  view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Network className="h-3.5 w-3.5" /> Mind Map
              </button>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={clearChat.isPending}
                onClick={async () => {
                  const ok = await confirm({
                    title: "Clear conversation?",
                    description: "Clear this Second Brain conversation. Your saved notes and memory will not be affected.",
                    confirmText: "Clear chat",
                    destructive: true,
                  });
                  if (ok) clearChat.mutate();
                }}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
                aria-label="Clear conversation"
              >
                {clearChat.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Clear chat</span>
              </Button>
            )}
          </div>
        </header>

        {view === "map" ? (
          <div className="p-3">
            {userId && (
              <BrainMindMap
                userId={userId}
                snapshotId={snapshotId}
                company={currentVenture?.company_name ?? null}
                onAskAbout={(label) => {
                  setView("chat");
                  setInput(`Tell me about ${label}`);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              />
            )}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {empty ? (
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-foreground">
                      Ask anything about your startup — brief, assets, assessments, notes. I'll cite what I used.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assetsReadyWithoutMemory
                        ? `Your ${status?.generated} startup assets are ready; rebuild memory so I can answer from them.`
                        : "Tip: rebuild memory after generating new assets so I have the latest."}
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
                history.map((m) => <BubbleMsg key={m.id} m={m} onSpeak={voiceOn ? speak : undefined} onSaveNote={saveMessageAsNote} />)
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
          </>
        )}
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

function BubbleMsg({ m, onSpeak, onSaveNote }: { m: BrainMessage; onSpeak?: (t: string) => void; onSaveNote?: (content: string, messageId?: string) => void | Promise<void> }) {
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
      <div className="mt-1 flex items-center gap-3">
        {onSpeak && (
          <button
            type="button"
            onClick={() => onSpeak(stripMarkdown(m.content))}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <Volume2 className="h-3 w-3" /> Play
          </button>
        )}
        {onSaveNote && (
          <button
            type="button"
            onClick={() => onSaveNote(m.content, m.id)}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            aria-label="Save answer as note"
          >
            <StickyNote className="h-3 w-3" /> Save as note
          </button>
        )}
      </div>
    </div>
  );
}

function parseNote(content: string): { title: string | null; body: string } {
  const raw = (content ?? "").trim();
  // Title: leading **bold** line, or leading "# heading" line.
  const boldMatch = raw.match(/^\*\*(.+?)\*\*\s*(?:\n+|$)/);
  if (boldMatch) {
    return { title: boldMatch[1].trim(), body: raw.slice(boldMatch[0].length).trim() };
  }
  const hashMatch = raw.match(/^#{1,6}\s+(.+?)\s*(?:\n+|$)/);
  if (hashMatch) {
    return { title: hashMatch[1].trim(), body: raw.slice(hashMatch[0].length).trim() };
  }
  return { title: null, body: raw };
}

function NoteCard({ note, onDelete }: { note: any; onDelete: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const { title, body } = useMemo(() => parseNote(note.content ?? ""), [note.content]);
  const hasLongBody = body.length > 180 || body.split("\n").length > 4;

  return (
    <li className="group rounded-lg border border-border/60 bg-background/50 p-3 text-xs shadow-sm transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left"
        >
          {title && (
            <div className="text-[13px] font-semibold leading-snug text-foreground">
              {title}
            </div>
          )}
          <div
            className={cn(
              "prose prose-sm prose-neutral dark:prose-invert max-w-none",
              "prose-p:my-1 prose-p:leading-relaxed",
              "prose-ul:my-1 prose-ul:pl-4 prose-ol:my-1 prose-ol:pl-4",
              "prose-li:my-0.5 prose-li:marker:text-muted-foreground",
              "prose-headings:mt-2 prose-headings:mb-1 prose-headings:text-foreground",
              "prose-strong:text-foreground prose-code:text-foreground",
              "prose-a:text-primary hover:prose-a:underline",
              "text-xs text-foreground/80",
              title && "mt-1",
              !open && "line-clamp-4",
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
          {hasLongBody && (
            <div className="mt-1 text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {open ? "Show less" : "Show more"}
            </div>
          )}
        </button>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete note"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Badge variant="outline" className="h-4 px-1 text-[9px]">{note.source}</Badge>
        {new Date(note.created_at).toLocaleDateString()}
      </div>
    </li>
  );
}
