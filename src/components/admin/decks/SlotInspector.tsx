import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, RotateCcw, Save, Loader2, Image as ImageIcon, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  saveTextOverride,
  saveImageOverride,
  resetOverride,
  uploadDeckImage,
  generateDeckImageViaAI,
  rewriteDeckCopyViaAI,
} from "@/lib/deck-overrides.functions";
import type { SlotMap } from "@/components/workshop-slides/slots";
import { slotKey } from "@/components/workshop-slides/slots";

export type SlotDescriptor = {
  key: string; // slotKey()
  slideId: string;
  field: string;
  kind: "text" | "image";
  defaultText?: string;
  defaultImageUrl?: string;
  defaultImageAlt?: string;
};

type Props = {
  deckSlug: string;
  slideId: string;
  slideTitle: string;
  descriptors: SlotDescriptor[];
  overrides: SlotMap;
};

export function SlotInspector({ deckSlug, slideId, slideTitle, descriptors, overrides }: Props) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Editing slide</div>
        <div className="text-base font-semibold tracking-tight">{slideTitle}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {descriptors.length} editable {descriptors.length === 1 ? "slot" : "slots"}
        </div>
      </div>

      {descriptors.length === 0 && (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No editable slots detected on this slide yet. Slots register the first time the slide
          renders — flip away and back, or wrap more content in &lt;SlotText&gt; / &lt;SlotImage&gt;
          to expose more.
        </div>
      )}

      <div className="space-y-3">
        {descriptors.map((d) => {
          const current = overrides[d.key];
          return d.kind === "text" ? (
            <TextSlotCard
              key={d.key}
              deckSlug={deckSlug}
              descriptor={d}
              currentText={current?.text ?? null}
            />
          ) : (
            <ImageSlotCard
              key={d.key}
              deckSlug={deckSlug}
              descriptor={d}
              currentUrl={current?.imageUrl ?? null}
              currentAlt={current?.imageAlt ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}

function useRefresh(deckSlug: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["deck-overrides", deckSlug] });
    qc.invalidateQueries({ queryKey: ["deck-override-counts"] });
  };
}

function TextSlotCard({
  deckSlug,
  descriptor,
  currentText,
}: {
  deckSlug: string;
  descriptor: SlotDescriptor;
  currentText: string | null;
}) {
  const refresh = useRefresh(deckSlug);
  const [value, setValue] = useState(currentText ?? descriptor.defaultText ?? "");
  const [aiOpen, setAiOpen] = useState(false);
  const dirty = value !== (currentText ?? descriptor.defaultText ?? "");
  const isOverridden = currentText !== null && currentText !== undefined;

  const save = useMutation({
    mutationFn: () =>
      saveTextOverride({ deckSlug, slideId: descriptor.slideId, field: descriptor.field, value }),
    onSuccess: () => {
      toast.success("Saved");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () =>
      resetOverride({ deckSlug, slideId: descriptor.slideId, field: descriptor.field }),
    onSuccess: () => {
      setValue(descriptor.defaultText ?? "");
      toast.success("Reset to default");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Type className="h-3.5 w-3.5" />
        <code className="font-mono">{descriptor.field}</code>
        {isOverridden && (
          <span className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            edited
          </span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={Math.min(8, Math.max(2, Math.ceil(value.length / 60)))}
        className="text-sm"
      />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{value.length} chars</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAiOpen(true)}
          className="gap-1"
        >
          <Sparkles className="h-3.5 w-3.5" /> Rewrite
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!isOverridden || reset.isPending}
          onClick={() => reset.mutate()}
          className="gap-1 text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <AiRewriteDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentText={value || descriptor.defaultText || ""}
        onAccept={(v) => {
          setValue(v);
          setAiOpen(false);
        }}
      />
    </div>
  );
}

function AiRewriteDialog({
  open,
  onClose,
  currentText,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  currentText: string;
  onAccept: (text: string) => void;
}) {
  const [tone, setTone] = useState("Sharper");
  const [instruction, setInstruction] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const tones = ["Sharper", "Friendlier", "Shorter", "Founder-flavored", "More authoritative"];

  const run = useMutation({
    mutationFn: () => rewriteDeckCopyViaAI({ currentText, tone, instruction }),
    onSuccess: (v) => {
      setVariants(v);
      if (v.length === 0) toast.warning("No variants returned — try a different instruction.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Rewrite with AI</DialogTitle>
          <DialogDescription>Pick a tone, add an optional instruction, and choose a variant.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Tone</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tones.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    tone === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Extra instruction (optional)</Label>
            <Input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. mention Atlanta founders"
            />
          </div>
          <Button onClick={() => run.mutate()} disabled={run.isPending} className="gap-1">
            {run.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate variants
          </Button>

          {variants.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs">Variants</Label>
              {variants.map((v, i) => (
                <div key={i} className="rounded-md border p-3">
                  <p className="text-sm whitespace-pre-wrap">{v}</p>
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={() => onAccept(v)}>
                      Use this
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImageSlotCard({
  deckSlug,
  descriptor,
  currentUrl,
  currentAlt,
}: {
  deckSlug: string;
  descriptor: SlotDescriptor;
  currentUrl: string | null;
  currentAlt: string | null;
}) {
  const refresh = useRefresh(deckSlug);
  const [urlInput, setUrlInput] = useState("");
  const [altInput, setAltInput] = useState(currentAlt ?? descriptor.defaultImageAlt ?? "");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModel, setAiModel] = useState<"google/gemini-3.1-flash-image" | "openai/gpt-image-2">(
    "google/gemini-3.1-flash-image",
  );
  const isOverridden = !!currentUrl;
  const displaySrc = currentUrl ?? descriptor.defaultImageUrl ?? null;

  const saveUrl = useMutation({
    mutationFn: (url: string) =>
      saveImageOverride({
        deckSlug,
        slideId: descriptor.slideId,
        field: descriptor.field,
        imageUrl: url,
        imageAlt: altInput,
      }),
    onSuccess: () => {
      toast.success("Image saved");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadDeckImage(file, deckSlug, descriptor.slideId, descriptor.field);
      await saveImageOverride({
        deckSlug,
        slideId: descriptor.slideId,
        field: descriptor.field,
        imageUrl: url,
        imageAlt: altInput,
      });
      return url;
    },
    onSuccess: () => {
      toast.success("Image uploaded");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generate = useMutation({
    mutationFn: async () => {
      const url = await generateDeckImageViaAI({
        prompt: aiPrompt,
        deckSlug,
        slideId: descriptor.slideId,
        field: descriptor.field,
        model: aiModel,
      });
      await saveImageOverride({
        deckSlug,
        slideId: descriptor.slideId,
        field: descriptor.field,
        imageUrl: url,
        imageAlt: altInput || aiPrompt.slice(0, 80),
      });
      return url;
    },
    onSuccess: () => {
      toast.success("Image generated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () =>
      resetOverride({ deckSlug, slideId: descriptor.slideId, field: descriptor.field }),
    onSuccess: () => {
      toast.success("Reset to default");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5" />
        <code className="font-mono">{descriptor.field}</code>
        {isOverridden && (
          <span className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            edited
          </span>
        )}
      </div>

      <div className="aspect-video w-full overflow-hidden rounded border bg-muted">
        {displaySrc ? (
          <img src={displaySrc} alt={altInput} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image yet
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">Alt text</Label>
        <Input value={altInput} onChange={(e) => setAltInput(e.target.value)} placeholder="Image description" />
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-2 pt-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
            }}
            disabled={upload.isPending}
          />
          {upload.isPending && <p className="text-xs text-muted-foreground">Uploading…</p>}
        </TabsContent>

        <TabsContent value="url" className="space-y-2 pt-2">
          <Input
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => urlInput && saveUrl.mutate(urlInput)}
            disabled={!urlInput || saveUrl.isPending}
          >
            {saveUrl.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save URL
          </Button>
        </TabsContent>

        <TabsContent value="ai" className="space-y-2 pt-2">
          <Textarea
            placeholder="Describe the image: e.g. minimalist purple-tinted illustration of a founder reviewing a roadmap on a whiteboard"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
          />
          <div className="flex items-center gap-2">
            <Label className="text-xs">Model</Label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value as typeof aiModel)}
              className="text-xs rounded border bg-background px-2 py-1"
            >
              <option value="google/gemini-3.1-flash-image">Gemini Nano Banana 2 (fast)</option>
              <option value="openai/gpt-image-2">GPT Image 2 (sharper text)</option>
            </select>
          </div>
          <Button
            size="sm"
            onClick={() => generate.mutate()}
            disabled={!aiPrompt || generate.isPending}
            className="gap-1"
          >
            {generate.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate
          </Button>
          {generate.isPending && (
            <p className="text-xs text-muted-foreground">Generating image — usually 5-20s…</p>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={!isOverridden || reset.isPending}
          onClick={() => reset.mutate()}
          className="gap-1 text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>
    </div>
  );
}

// avoid unused-import warning when slotKey isn't referenced elsewhere
void slotKey;
