import { useRef, useState } from "react";
import { Upload, FileText, Loader2, X, CheckCircle2, AlertCircle, Link2, Plus } from "lucide-react";
import { prefillBriefFromDocs, type BriefPrefillResponse } from "@/lib/brief.functions";
import { uploadVentureSource } from "@/lib/venture-sources";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


const ACCEPT = ".pdf,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.wav,.webm,.ogg,.mp4";
const MAX_FILES = 5;
const MAX_URLS = 3;
const MAX_BYTES = 20 * 1024 * 1024;

type FileStatus = { file: File; error?: string };

type ScrapeResult = {
  url: string;
  title: string | null;
  text: string;
  charCount?: number;
  error?: string;
};

function safeHost(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "source"; }
}

function isValidHttpUrl(u: string): boolean {
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch { return false; }
}

export function BriefPrefillDropzone({
  onSuggestions,
  onDismiss,
}: {
  onSuggestions: (r: BriefPrefillResponse) => void;
  onDismiss?: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlDraft, setUrlDraft] = useState("");
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
  const removeUrl = (i: number) => setUrls((prev) => prev.filter((_, idx) => idx !== i));

  const addUrl = () => {
    let candidate = urlDraft.trim();
    if (!candidate) return;
    if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
    if (!isValidHttpUrl(candidate)) {
      toast.error("That doesn't look like a valid URL.");
      return;
    }
    if (urls.includes(candidate)) {
      setUrlDraft("");
      return;
    }
    if (urls.length >= MAX_URLS) {
      toast.error(`Up to ${MAX_URLS} URLs.`);
      return;
    }
    setUrls((prev) => [...prev, candidate]);
    setUrlDraft("");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const runPrefill = async () => {
    const okFiles = files.filter((f) => !f.error).map((f) => f.file);
    if (okFiles.length === 0 && urls.length === 0) {
      toast.error("Add at least one valid file or URL first.");
      return;
    }
    setBusy(true);
    try {
      // 1. Scrape URLs first (if any) and turn each into a synthetic .md File.
      const scrapedFiles: File[] = [];
      if (urls.length > 0) {
        try {
          const { data, error } = await supabase.functions.invoke("venture-scrape-url", {
            body: { urls },
          });
          if (error) throw new Error(error.message);
          const results: ScrapeResult[] = Array.isArray((data as any)?.results) ? (data as any).results : [];
          for (const r of results) {
            if (r.error || !r.text || !r.text.trim()) {
              toast.error(`${r.url}: ${r.error || "no readable text"}`);
              continue;
            }
            const filename = `${safeHost(r.url)}.md`;
            const body = `# ${r.title ?? r.url}\n\nSource: ${r.url}\n\n${r.text}`;
            scrapedFiles.push(new File([body], filename, { type: "text/markdown" }));
          }
        } catch (e) {
          toast.error(e instanceof Error ? `URL scrape failed: ${e.message}` : "URL scrape failed");
        }
      }

      // 2. Persist every input (dropped + scraped) into the venture library so
      //    the context follows the founder through the whole workflow.
      const toPersist: File[] = [...okFiles, ...scrapedFiles];
      Promise.allSettled(
        toPersist.map((file) =>
          uploadVentureSource({ file, kind: "brief_source", usedInBrief: true }),
        ),
      ).catch(() => {});

      // 3. Run the actual prefill against the combined set.
      const combined = [...okFiles, ...scrapedFiles];
      if (combined.length === 0) {
        toast.error("Nothing usable to pre-fill from yet.");
        return;
      }
      const result = await prefillBriefFromDocs(combined);
      onSuggestions(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read those sources.");
    } finally {
      setBusy(false);
    }
  };

  const canRun = !busy && (files.filter((f) => !f.error).length > 0 || urls.length > 0);

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight">
            Skip the typing. Drop docs or paste links.
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your site, a Notion page, a deck — anything that already describes the startup. We'll read it all and fill in the 10 answers. Captured once, used everywhere downstream.
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

      {/* URL ingestion */}
      <div className="mt-4">
        <div className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" /> Or paste a link
          <span className="font-normal text-muted-foreground">
            — up to {MAX_URLS} URLs (your site, a Notion page, an article…)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addUrl(); }
            }}
            placeholder="https://example.com/about"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
            disabled={urls.length >= MAX_URLS}
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={urls.length >= MAX_URLS || !urlDraft.trim()}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {urls.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {urls.map((u, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{u}</span>
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove URL"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={runPrefill}
          disabled={!canRun}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {busy ? "Reading your sources…" : "Pre-fill my answers"}
        </button>
      </div>
    </div>
  );
}
