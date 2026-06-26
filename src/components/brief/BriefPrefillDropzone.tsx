import { useRef, useState } from "react";
import { Upload, FileText, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { prefillBriefFromDocs, type BriefPrefillResponse } from "@/lib/brief.functions";
import { uploadVentureSource } from "@/lib/venture-sources";
import { toast } from "sonner";


const ACCEPT = ".pdf,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.wav,.webm,.ogg,.mp4";
const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024;

type FileStatus = { file: File; error?: string };

export function BriefPrefillDropzone({
  onSuggestions,
  onDismiss,
}: {
  onSuggestions: (r: BriefPrefillResponse) => void;
  onDismiss?: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    const validated: FileStatus[] = list.map((file) => {
      if (file.size > MAX_BYTES) return { file, error: "Too large (>20 MB)" };
      if (file.size < 16) return { file, error: "Empty file" };
      return { file };
    });
    setFiles((prev) => [...prev, ...validated].slice(0, MAX_FILES));
  };

  const removeAt = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const runPrefill = async () => {
    const ok = files.filter((f) => !f.error).map((f) => f.file);
    if (ok.length === 0) {
      toast.error("Add at least one valid file first.");
      return;
    }
    setBusy(true);
    try {
      // Persist each file into the user's venture library (no snapshot yet —
      // they become reusable orphans that the Hub creation flow can attach).
      // Fire and forget on persistence; don't block pre-fill if storage fails.
      Promise.allSettled(
        ok.map((file) =>
          uploadVentureSource({ file, kind: "brief_source", usedInBrief: true }),
        ),
      ).catch(() => {});

      const result = await prefillBriefFromDocs(ok);
      onSuggestions(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read those docs.");
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight">
            Skip the typing. Drop your deck, one-pager, or notes.
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            We'll read them and fill in the 10 answers — you just review and tweak.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
            aria-label="Hide pre-fill"
          >
            Hide
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragOver ? "border-primary bg-primary/10" : "border-border bg-background/50 hover:bg-background"
        }`}
      >
        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
        <div className="mt-2 text-sm">
          <span className="font-medium text-foreground">Drop files here</span>{" "}
          <span className="text-muted-foreground">or click to choose</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          PDF · DOCX · TXT · MD · RTF · PNG/JPG · MP3/M4A/WAV · up to {MAX_FILES} files, 20 MB each
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs"
            >
              {f.error ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{f.file.name}</span>
              <span className="text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB</span>
              {f.error && <span className="text-destructive">{f.error}</span>}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={runPrefill}
          disabled={busy || files.filter((f) => !f.error).length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {busy ? "Reading your docs…" : "Pre-fill my answers"}
        </button>
      </div>
    </div>
  );
}
