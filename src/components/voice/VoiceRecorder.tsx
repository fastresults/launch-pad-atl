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

export function VoiceRecorder({ onTranscript, context, disabled, size = "icon" }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const transcribeFn = useServerFn(transcribeAudio);

  const stop = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(async () => {
    if (recording || processing) return;
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
        if (blob.size < 200) {
          setProcessing(false);
          return;
        }
        setProcessing(true);
        try {
          const buf = await blob.arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          const { text } = await transcribeFn({ data: { audio_base64: b64, mime_type: mime, context } });
          if (text) onTranscript(text);
          else toast.info("Didn't catch that. Try again?");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Transcription failed");
        } finally {
          setProcessing(false);
        }
      };
      rec.start();
      setRecording(true);
    } catch (e) {
      toast.error("Microphone access denied or unavailable");
      console.error(e);
    }
  }, [recording, processing, context, onTranscript, transcribeFn]);

  return (
    <Button
      type="button"
      variant={recording ? "destructive" : "outline"}
      size={size}
      onClick={recording ? stop : start}
      disabled={disabled || processing}
      title={recording ? "Stop recording" : "Record voice"}
    >
      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
