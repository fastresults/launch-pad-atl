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

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="concept">Business concept *</Label>
            <VoiceRecorder
              size="sm"
              context="Founder describing their business concept — what they're building, who it's for, and why it matters."
              onTranscript={(text) =>
                setBusinessConcept((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
              }
            />
          </div>
          <Textarea
            id="concept"
            value={businessConcept}
            onChange={(e) => setBusinessConcept(e.target.value)}
            placeholder="Describe what you're building, who it's for, and why it matters. The more specific, the better the output. Tap the mic to dictate instead."
            rows={6}
          />
          <p className="text-xs text-muted-foreground">{businessConcept.trim().length} characters (min 20)</p>
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
