import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { edgeErrorMessage } from "@/lib/edge-errors";

const QUICK_TAGS = [
  "Too generic",
  "Wrong tone",
  "Factually off",
  "Too long",
  "Too short",
  "Missing detail",
];

export type RewriteTarget = { type: string; name: string } | null;

interface Props {
  target: RewriteTarget;
  onClose: () => void;
  onSubmit: (feedback: string, tags: string[]) => void;
}

export function RewriteFeedbackDialog({ target, onClose, onSubmit }: Props) {
  const [feedback, setFeedback] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!target) {
      setFeedback("");
      setTags([]);
      setElapsed(0);
      stopTracks();
    }
  }, [target]);

  useEffect(() => () => stopTracks(), []);

  function stopTracks() {
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ["audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
      if (!mimeType) {
        stream.getTracks().forEach((t) => t.stop());
        toast.error("This browser can't record a supported audio format.");
        return;
      }
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (blob.size < 1024) {
          toast.error("That recording was empty — please try again.");
          return;
        }
        await transcribe(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
      setRecording(true);
    } catch {
      toast.error("Microphone access is needed to record.");
    }
  }

  function stopRecording() {
    setRecording(false);
    recorderRef.current?.stop();
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      const form = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("file", blob, `recording.${ext}`);
      const { data, error } = await supabase.functions.invoke("venture-transcribe", { body: form });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const text: string = data?.text ?? "";
      if (text) {
        setFeedback((prev) => (prev ? `${prev.trim()}\n${text}` : text));
      } else {
        toast.error("Couldn't transcribe — try typing instead.");
      }
    } catch (e) {
      toast.error(edgeErrorMessage(e, "Transcription failed"));
    } finally {
      setTranscribing(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const canSubmit = (feedback.trim().length > 0 || tags.length > 0) && !recording && !transcribing;
  const open = target !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rewrite {target?.name ?? "asset"}</DialogTitle>
          <DialogDescription>
            Tell us what's off and what you'd like changed. The next version will follow your guidance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. The tone is too corporate. Make it warmer and add a concrete example for restaurant owners."
              rows={6}
              className="min-h-[140px] resize-y pr-12"
              disabled={transcribing}
            />
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              aria-label={recording ? "Stop recording" : "Start voice input"}
              className={`absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-50 ${
                recording ? "border-status-danger text-status-danger" : ""
              }`}
            >
              {transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : recording ? (
                <Square className="h-4 w-4 fill-current" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          </div>

          {(recording || transcribing) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {recording && (
                <>
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-status-danger" />
                  <span>Listening… {elapsed}s — tap stop when done</span>
                </>
              )}
              {transcribing && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Transcribing…</span>
                </>
              )}
            </div>
          )}

          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Quick tags (optional)</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!canSubmit}
            onClick={() => onSubmit(feedback.trim(), tags)}
          >
            Rewrite with feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
