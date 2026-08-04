import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  generateHeroImage,
  publishHeroImage,
  screensFromPrompt,
  subjectFromPrompt,
  HERO_IMAGE_MODELS,
  type HeroImageRow,
} from "@/lib/workshop-hero-images.functions";
import type { HeroPainEntry } from "@/routes/_authenticated/_admin/admin.hero-images";

type Props = {
  workshopSlug: string;
  entry: HeroPainEntry | null;
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Pre-fills the exact prompt behind the current picture and sends the admin's
 * edited prompt verbatim when generating a new take.
 */
export function HeroImageRegenerateDialog({ workshopSlug, entry, onClose, onSaved }: Props) {
  const [model, setModel] = useState<string>(HERO_IMAGE_MODELS[0].id);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<HeroImageRow | null>(null);
  const [fullPrompt, setFullPrompt] = useState("");

  useEffect(() => {
    if (!entry) return;
    const source = entry.published?.prompt ?? entry.prompt;
    setModel(entry.published?.model ?? HERO_IMAGE_MODELS[0].id);
    setFullPrompt(source);
    setPreview(null);
  }, [entry]);

  if (!entry) return null;

  const promptToSend = fullPrompt.trim();

  async function generate() {
    setBusy(true);
    try {
      const row = await generateHeroImage({
        workshopSlug,
        painId: entry!.painId,
        subject: subjectFromPrompt(promptToSend),
        screens: screensFromPrompt(promptToSend),
        model,
        prompt: promptToSend,
      });
      setPreview(row);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }


  async function publish() {
    if (!preview) return;
    setBusy(true);
    try {
      await publishHeroImage(preview);
      toast.success("Published — it's live on the hero now");
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Regenerate: {entry.pain}</DialogTitle>
          <DialogDescription>
            {entry.question ? `Typed in the hero as "${entry.question}"` : "Hero rotation image"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HERO_IMAGE_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-prompt">Prompt</Label>
            <Textarea
              id="hero-prompt"
              rows={14}
              value={fullPrompt}
              className="text-sm leading-relaxed"
              onChange={(e) => setFullPrompt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This exact prompt will be sent to the image model.
            </p>
          </div>


          {preview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <img
                src={preview.image_url}
                alt={`New take for ${entry.pain}`}
                className="w-full rounded-md object-cover"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button variant="outline" onClick={generate} disabled={busy || !promptToSend}>
            {busy ? "Working…" : preview ? "Generate again" : "Generate"}
          </Button>
          {preview && (
            <Button onClick={publish} disabled={busy}>
              Publish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
