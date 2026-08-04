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
import { Switch } from "@/components/ui/switch";
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
  composeHeroPrompt,
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
 * Pre-fills the exact prompt behind the current picture so an operator only
 * edits the subject line — the shared cinematic look and the screen rule are
 * appended server-side, identically to how the shipped set was made.
 */
export function HeroImageRegenerateDialog({ workshopSlug, entry, onClose, onSaved }: Props) {
  const [subject, setSubject] = useState("");
  const [screens, setScreens] = useState(false);
  const [model, setModel] = useState<string>(HERO_IMAGE_MODELS[0].id);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<HeroImageRow | null>(null);

  useEffect(() => {
    if (!entry) return;
    const source = entry.published?.prompt ?? entry.prompt;
    setSubject(entry.published?.subject ?? subjectFromPrompt(source));
    setScreens(entry.published?.screens ?? screensFromPrompt(source));
    setModel(entry.published?.model ?? HERO_IMAGE_MODELS[0].id);
    setPreview(null);
  }, [entry]);

  if (!entry) return null;

  async function generate() {
    setBusy(true);
    try {
      const row = await generateHeroImage({
        workshopSlug,
        painId: entry!.painId,
        subject: subject.trim(),
        screens,
        model,
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
            <Label htmlFor="hero-subject">Subject</Label>
            <Textarea
              id="hero-subject"
              rows={5}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="hero-screens">Screens show content</Label>
              <p className="text-xs text-muted-foreground">
                Shapes and blocks with blurred text, instead of blank screens.
              </p>
            </div>
            <Switch id="hero-screens" checked={screens} onCheckedChange={setScreens} />
          </div>

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
            <Label>Full prompt sent</Label>
            <p className="rounded bg-muted p-2 text-xs leading-relaxed text-muted-foreground">
              {composeHeroPrompt(subject.trim(), screens)}
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
          <Button variant="outline" onClick={generate} disabled={busy || !subject.trim()}>
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
