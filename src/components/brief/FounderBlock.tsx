import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Link2, Sparkles, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  getFounderProfile,
  extractFounderFromText,
  upsertFounderProfile,
  createResumeUploadUrl,
} from "@/lib/discovery.functions";

type Props = {
  onDone: () => void;
};

export function FounderBlock({ onDone }: Props) {
  const getFn = useServerFn(getFounderProfile);
  const extractFn = useServerFn(extractFounderFromText);
  const upsertFn = useServerFn(upsertFounderProfile);
  const signFn = useServerFn(createResumeUploadUrl);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["my", "founder-profile"],
    queryFn: () => getFn(),
  });

  const profile = (data?.profile ?? null) as Record<string, unknown> | null;
  const extracted = (profile?.extracted ?? {}) as Record<string, unknown>;
  const hasExtraction =
    !!extracted &&
    (Array.isArray(extracted.roles) && (extracted.roles as unknown[]).length > 0 ||
      Array.isArray(extracted.skills) && (extracted.skills as unknown[]).length > 0 ||
      (typeof extracted.headline === "string" && extracted.headline.length > 0));

  const [linkedinUrl, setLinkedinUrl] = useState<string>((profile?.linkedin_url as string) ?? "");
  const [rawText, setRawText] = useState<string>((profile?.raw_text as string) ?? "");
  const [filePath, setFilePath] = useState<string | null>((profile?.source_file_path as string) ?? null);
  const [filename, setFilename] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [rightPerson, setRightPerson] = useState<string>((profile?.right_person_reason as string) ?? "");
  const [edge, setEdge] = useState<string>((profile?.unfair_advantage as string) ?? "");
  const [extractNote, setExtractNote] = useState<string | null>(null);

  const hasText = rawText.trim().length >= 20;
  const hasFile = !!filePath;
  const hasLinkedin = linkedinUrl.trim().length > 0;
  const canExtract = hasText || hasFile || hasLinkedin;

  const ctaLabel = extracting
    ? hasFile && !hasText
      ? "Reading your resume…"
      : "Reading…"
    : hasText
      ? hasExtraction
        ? "Re-extract"
        : "Extract with AI"
      : hasFile
        ? "Read my resume"
        : hasLinkedin
          ? "Save LinkedIn & continue"
          : "Extract with AI";

  const runExtract = async (overrides?: { filePath?: string | null }) => {
    const effectiveFilePath = overrides?.filePath !== undefined ? overrides.filePath : filePath;
    const effectiveHasFile = !!effectiveFilePath;
    if (!hasText && !effectiveHasFile && !hasLinkedin) {
      toast.error("Add a resume, LinkedIn URL, or paste your background.");
      return;
    }
    setExtracting(true);
    setExtractNote(null);
    try {
      const res = await extractFn({
        data: {
          raw_text: hasText ? rawText.trim() : null,
          linkedin_url: hasLinkedin ? linkedinUrl.trim() : null,
          source: effectiveHasFile ? "resume" : hasLinkedin ? "linkedin" : "manual",
          source_file_path: effectiveFilePath ?? null,
        },
      });
      await refetch();
      if (res?.note) {
        setExtractNote(res.note);
        toast.message(res.note);
      } else {
        toast.success("Got it. Check what we extracted below.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const onFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max 10MB");
      return;
    }
    setUploading(true);
    try {
      const { path, signedUrl } = await signFn({
        data: { filename: file.name, mime: file.type || "application/octet-stream" },
      });
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!res.ok) throw new Error("Upload failed");
      setFilePath(path);
      setFilename(file.name);
      // Auto-trigger extraction so the user doesn't also have to paste text.
      if (file.name.toLowerCase().endsWith(".pdf")) {
        toast.success("Uploaded. Reading your resume…");
        await runExtract({ filePath: path });
      } else {
        toast.success("Uploaded. Click below to extract — or paste the text for DOCX files.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveAnswersAndContinue = async () => {
    try {
      await upsertFn({
        data: {
          right_person_reason: rightPerson.trim() || null,
          unfair_advantage: edge.trim() || null,
        },
      });
      await refetch();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mt-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
          Tell us about you — the fastest way is to upload.
        </h1>
        <p className="mt-3 text-muted-foreground">
          The AI will use your background to align positioning, advantages, and credibility across every deliverable.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-white/10 bg-card p-5 hover:border-primary/40">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4" /> Upload your resume
          </div>
          <p className="text-xs text-muted-foreground">PDF or DOCX. Max 10MB.</p>
          <input
            type="file"
            accept=".pdf,.docx,.doc,application/pdf"
            className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
            disabled={uploading}
          />
          {(filename || filePath) && (
            <p className="text-xs text-emerald-500 truncate">✓ {filename || "Uploaded"}</p>
          )}
        </label>

        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4" /> Or paste your LinkedIn URL
          </div>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/yourname"
            className="rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">We'll keep this for reference.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card p-5">
        <div className="text-sm font-medium">Paste your resume text or a short bio</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Open your resume or LinkedIn, select all (Cmd/Ctrl+A), and paste below. AI extracts the structure for you.
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={8}
          placeholder="Paste your background here…"
          className="mt-3 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-col items-end gap-2">
          <button
            onClick={() => runExtract()}
            disabled={extracting || uploading || !canExtract}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {ctaLabel}
          </button>
          <p className="text-xs text-muted-foreground">
            Any one works — upload, link, or paste. Combine them for the best result.
          </p>
          {extractNote && (
            <p className="text-xs text-amber-500 max-w-md text-right">{extractNote}</p>
          )}
        </div>
      </div>

      {hasExtraction && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-500">
            <Sparkles className="h-3.5 w-3.5" /> Did we get this right?
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            {extracted.headline ? <div><span className="text-muted-foreground">Headline:</span> {String(extracted.headline)}</div> : null}
            {extracted.years_experience ? <div><span className="text-muted-foreground">Experience:</span> {String(extracted.years_experience)} years</div> : null}
            {Array.isArray(extracted.roles) && (extracted.roles as Array<{title:string;company?:string}>).length > 0 && (
              <div><span className="text-muted-foreground">Roles:</span> {(extracted.roles as Array<{title:string;company?:string}>).map((r) => `${r.title}${r.company ? ` @ ${r.company}` : ""}`).join("; ")}</div>
            )}
            {Array.isArray(extracted.skills) && (extracted.skills as string[]).length > 0 && (
              <div><span className="text-muted-foreground">Skills:</span> {(extracted.skills as string[]).join(", ")}</div>
            )}
            {Array.isArray(extracted.industries) && (extracted.industries as string[]).length > 0 && (
              <div><span className="text-muted-foreground">Industries:</span> {(extracted.industries as string[]).join(", ")}</div>
            )}
            {Array.isArray(extracted.wins) && (extracted.wins as string[]).length > 0 && (
              <div><span className="text-muted-foreground">Wins:</span> {(extracted.wins as string[]).join("; ")}</div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Why are you the right person to start this?</label>
          <textarea
            value={rightPerson}
            onChange={(e) => setRightPerson(e.target.value)}
            rows={3}
            placeholder="Optional — one or two sentences."
            className="mt-2 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">What's your unfair advantage?</label>
          <textarea
            value={edge}
            onChange={(e) => setEdge(e.target.value)}
            rows={3}
            placeholder="Optional — relationships, expertise, distribution, timing…"
            className="mt-2 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveAnswersAndContinue}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
