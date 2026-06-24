// @ts-nocheck
import { useCallback, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FoundersHubGate } from "@/components/hub/FoundersHubGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSnapshot } from "@/lib/foundersHub.functions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Sparkles, Upload, FileText, X, Wand2 } from "lucide-react";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { toast } from "sonner";

type DroppedFile = {
  id: string;
  name: string;
  size: number;
  status: "reading" | "ready" | "error";
  text?: string;
  error?: string;
};

const MAX_FILES = 5;
const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = ".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf";

async function extractFileText(file: File): Promise<{ text: string; error?: string }> {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isText = name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown") ||
    file.type === "text/plain" || file.type === "text/markdown";

  if (isPdf) {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      const merged = (Array.isArray(text) ? text.join("\n") : text).trim();
      if (!merged) return { text: "", error: "PDF looks scanned (no text inside). Try a text-based export." };
      return { text: merged };
    } catch (e) {
      return { text: "", error: e instanceof Error ? e.message : "Couldn't read PDF" };
    }
  }
  if (isText) {
    try {
      const text = (await file.text()).trim();
      if (!text) return { text: "", error: "File was empty" };
      return { text };
    } catch (e) {
      return { text: "", error: e instanceof Error ? e.message : "Couldn't read file" };
    }
  }
  return { text: "", error: "DOCX coming soon — export to PDF or paste the text below." };
}

type Path = "own" | "competitor" | "manual";

export default function HubNewPage() {
  return (
    <FoundersHubGate>
      <Inner />
    </FoundersHubGate>
  );
}

function Inner() {
  const nav = useNavigate();
  const [path, setPath] = useState<Path>("own");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessConcept, setBusinessConcept] = useState("");
  const [diff, setDiff] = useState("");
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = useCallback(async (incoming: File[]) => {
    if (!incoming.length) return;
    setFiles((prev) => {
      const room = MAX_FILES - prev.length;
      if (room <= 0) {
        toast.error(`Max ${MAX_FILES} files`);
        return prev;
      }
      const accepted = incoming.slice(0, room).filter((f) => {
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name} is over 20 MB`);
          return false;
        }
        return true;
      });
      const queued: DroppedFile[] = accepted.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        status: "reading",
      }));
      // Kick off extraction outside of setState
      queued.forEach((entry, i) => {
        const file = accepted[i];
        extractFileText(file).then(({ text, error }) => {
          setFiles((curr) =>
            curr.map((x) =>
              x.id === entry.id
                ? error
                  ? { ...x, status: "error", error }
                  : { ...x, status: "ready", text }
                : x,
            ),
          );
        });
      });
      return [...prev, ...queued];
    });
  }, []);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const readyFiles = files.filter((f) => f.status === "ready" && (f.text ?? "").trim());

  const draftFromFiles = async () => {
    if (!readyFiles.length || drafting) return;
    if (businessConcept.trim() && !confirm("Replace what's in the concept field with a fresh draft from your files?")) {
      return;
    }
    setDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke("venture-synthesize-concept", {
        body: { sources: readyFiles.map((f) => ({ filename: f.name, text: f.text })) },
      });
      if (error) throw error;
      const concept = (data?.concept ?? "").trim();
      if (!concept) throw new Error("Empty draft from the model");
      setBusinessConcept(concept);
      toast.success("Drafted from your files — edit as needed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't draft from files");
    } finally {
      setDrafting(false);
    }
  };

  const create = useMutation({
    mutationFn: () =>
      createSnapshot({
        data: {
          company_name: companyName || undefined,
          website_url: websiteUrl || undefined,
          business_concept: businessConcept,
          differentiation_statement: diff || undefined,
        },
      }),
    onSuccess: ({ id }) => {
      toast.success("Venture created — enriching now");
      nav(`/dashboard/hub/${id}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create venture"),
  });

  const canSubmit = businessConcept.trim().length >= 20 && !create.isPending &&
    (path === "manual" ? !!companyName.trim() : !!websiteUrl.trim());

  return (
    <div className="space-y-6">
      <Link to="/dashboard/hub" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to ventures
      </Link>

      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Step 1 of 4 — Concept
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Tell us about the venture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick how you want us to enrich it. We'll pull context, then you review before generation.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {([
          { k: "own", label: "I have a website", hint: "We'll scrape it" },
          { k: "competitor", label: "Patterned from competitor", hint: "Borrow + differentiate" },
          { k: "manual", label: "Manual", hint: "Describe it yourself" },
        ] as { k: Path; label: string; hint: string }[]).map((opt) => (
          <button
            key={opt.k}
            type="button"
            onClick={() => setPath(opt.k)}
            className={`rounded-xl border p-4 text-left transition ${
              path === opt.k ? "border-foreground bg-card" : "border-white/10 bg-card/40 hover:border-white/20"
            }`}
          >
            <div className="text-sm font-medium">{opt.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{opt.hint}</div>
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
        <div className="grid gap-2">
          <Label htmlFor="company">Company name {path === "manual" && <span className="text-red-500">*</span>}</Label>
          <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Northbound Roasters" />
        </div>

        {path !== "manual" && (
          <div className="grid gap-2">
            <Label htmlFor="url">{path === "own" ? "Your website URL *" : "Competitor URL *"}</Label>
            <Input id="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </div>
        )}

        <div className="grid gap-3 rounded-xl border border-white/10 bg-background/40 p-4">
          <div>
            <div className="text-sm font-medium">Your business concept</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Type it, dictate it, or drop in your notes — pick whatever's easiest. We'll use it to build everything else.
            </p>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = Array.from(e.dataTransfer.files ?? []);
              addFiles(dropped);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition ${
              dragOver ? "border-primary bg-primary/5" : "border-white/15 hover:border-white/30"
            }`}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium">Drop your pitch deck, one-pager, or notes</span>
              <span className="text-muted-foreground"> — or click to browse</span>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              PDF · TXT · MD · up to {MAX_FILES} files, 20 MB each
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                addFiles(list);
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className={`shrink-0 text-[11px] uppercase tracking-wider ${
                    f.status === "ready" ? "text-emerald-400" :
                    f.status === "error" ? "text-red-400" :
                    "text-muted-foreground"
                  }`}>
                    {f.status === "reading" ? "Reading…" : f.status === "ready" ? "Ready" : (f.error ?? "Couldn't read")}
                  </span>
                  <button type="button" onClick={() => removeFile(f.id)} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Remove file">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="concept">Business concept *</Label>
              <div className="flex items-center gap-2">
                {readyFiles.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={draftFromFiles}
                    disabled={drafting}
                  >
                    {drafting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
                    {drafting ? "Drafting…" : `Draft from ${readyFiles.length} file${readyFiles.length === 1 ? "" : "s"}`}
                  </Button>
                )}
                <VoiceRecorder
                  size="sm"
                  context="Founder describing their business concept — what they're building, who it's for, and why it matters."
                  onTranscript={(text) =>
                    setBusinessConcept((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
                  }
                />
              </div>
            </div>
            <Textarea
              id="concept"
              value={businessConcept}
              onChange={(e) => setBusinessConcept(e.target.value)}
              placeholder="Describe what you're building, who it's for, and why it matters — or drop notes above and we'll draft it for you. You can also tap the mic to dictate."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">{businessConcept.trim().length} characters (min 20)</p>
          </div>
        </div>

        {path === "competitor" && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="diff">How you'll differentiate</Label>
              <VoiceRecorder
                size="sm"
                context="Founder explaining how their venture will differentiate from a competitor."
                onTranscript={(text) =>
                  setDiff((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
                }
              />
            </div>
            <Textarea id="diff" value={diff} onChange={(e) => setDiff(e.target.value)} rows={3} placeholder="What you'll do differently from the competitor. Tap the mic to dictate." />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button disabled={!canSubmit} onClick={() => create.mutate()}>
          {create.isPending ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Creating…</> : "Create & enrich →"}
        </Button>
      </div>
    </div>
  );
}
