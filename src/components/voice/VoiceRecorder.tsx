import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { transcribeAudio } from "@/lib/voice.functions";
import { toast } from "sonner";

type Props = {
  onTranscript: (text: string) => void;
  context?: string;
  disabled?: boolean;
  size?: "icon" | "sm";
};

// Convert an ArrayBuffer to base64 without blowing the call stack on large blobs.
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function VoiceRecorder({ onTranscript, context, disabled, size = "icon" }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const transcribeFn = useServerFn(transcribeAudio);

  // Keep latest onTranscript/context in refs so the rec.onstop closure
  // (set when the user clicked record) always calls the freshest handler.
  const onTranscriptRef = useRef(onTranscript);
  const contextRef = useRef(context);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    contextRef.current = context;
  }, [onTranscript, context]);

  const stop = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch { /* ignore */ }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
  }, []);

  // Stop microphone tracks on unmount only.
  useEffect(() => {
    return () => {
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        try { rec.stop(); } catch { /* ignore */ }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = useCallback(async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        if (blob.size < 200) {
          toast.info("Recording was too short. Try again?");
          return;
        }
        setProcessing(true);
        try {
          const buf = await blob.arrayBuffer();
          const b64 = arrayBufferToBase64(buf);
          const { text } = await transcribeFn({
            data: { audio_base64: b64, mime_type: mime, context: contextRef.current },
          });
          if (text && text.trim().length > 0) {
            onTranscriptRef.current(text);
          } else {
            toast.info("Didn't catch that. Try again?");
          }
        } catch (e) {
          console.error("[VoiceRecorder] transcription failed", e);
          toast.error(e instanceof Error ? e.message : "Transcription failed");
        } finally {
          setProcessing(false);
        }
      };
      rec.start();
      setRecording(true);
    } catch (e) {
      console.error("[VoiceRecorder] mic error", e);
      toast.error("Microphone access denied or unavailable");
    }
  }, [recording, transcribeFn]);

  const onClick = () => {
    if (recording) stop();
    else if (!processing) start();
  };

  const title = recording
    ? "Stop recording"
    : processing
      ? "Transcribing…"
      : "Record voice";

  return (
    <div className="flex items-center gap-2">
      {processing && !recording && (
        <span className="text-xs text-muted-foreground">Transcribing…</span>
      )}
      <Button
        type="button"
        variant={recording ? "destructive" : "outline"}
        size={size}
        onClick={onClick}
        disabled={disabled || processing}
        title={title}
        aria-label={title}
      >
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : recording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
