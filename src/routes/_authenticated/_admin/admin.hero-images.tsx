import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FOUNDATION_SLUG, WORKSHOP_CATALOG } from "@/lib/workshop-catalog";
import { getWorkshopPains } from "@/lib/workshop-pains";
import { getBundledSceneImage } from "@/lib/workshop-scenes";
import {
  deleteHeroImage,
  generateHeroImage,
  listHeroImages,
  publishHeroImage,
  revertHeroImage,
  screensFromPrompt,
  subjectFromPrompt,
  uploadHeroImage,
  type HeroImageRow,
} from "@/lib/workshop-hero-images.functions";
import { HeroImageCard } from "@/components/admin/hero-images/HeroImageCard";
import { HeroImageRegenerateDialog } from "@/components/admin/hero-images/HeroImageRegenerateDialog";

/** Foundation keeps the founder scene library, so only the build lanes appear. */
const BUILD_WORKSHOPS = WORKSHOP_CATALOG.filter((w) => w.slug !== FOUNDATION_SLUG);

export type HeroPainEntry = {
  painId: string;
  pain: string;
  question?: string;
  prompt: string;
  bundled: string | null;
  published: HeroImageRow | null;
  history: HeroImageRow[];
  promptOverride?: string;
};

export default function AdminHeroImagesPage() {
  const qc = useQueryClient();
  const [slug, setSlug] = useState(BUILD_WORKSHOPS[0]?.slug ?? "");
  const [editing, setEditing] = useState<HeroPainEntry | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const uploadTarget = useRef<HeroPainEntry | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const rowsQ = useQuery({
    queryKey: ["admin_hero_images", slug],
    queryFn: () => listHeroImages(slug),
    enabled: Boolean(slug),
  });

  const entries = useMemo<HeroPainEntry[]>(() => {
    const rows = rowsQ.data ?? [];
    return getWorkshopPains(slug).map((pain) => {
      const forPain = rows.filter((r) => r.pain_id === pain.id);
      return {
        painId: pain.id,
        pain: pain.pain,
        question: pain.question,
        prompt: pain.imagePrompt,
        bundled: getBundledSceneImage(slug, pain.id),
        published: forPain.find((r) => r.status === "published") ?? null,
        history: forPain.filter((r) => r.status !== "published"),
      };
    });
  }, [slug, rowsQ.data]);

  const missing = entries.filter((e) => !e.bundled && !e.published);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin_hero_images", slug] });

  const publishM = useMutation({
    mutationFn: publishHeroImage,
    onSuccess: () => {
      toast.success("Published — it's live on the hero now");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revertM = useMutation({
    mutationFn: revertHeroImage,
    onSuccess: () => {
      toast.success("Reverted to the bundled image");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: deleteHeroImage,
    onSuccess: () => {
      toast.success("Take deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadM = useMutation({
    mutationFn: (file: File) =>
      uploadHeroImage({ workshopSlug: slug, painId: uploadTarget.current!.painId, file }),
    onSuccess: () => {
      toast.success("Uploaded as a draft — publish it when you're happy");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Sequential so we never stack image requests against the rate limit. */
  async function regenerateMissing() {
    if (!missing.length) return;
    setBatchRunning(true);
    let done = 0;
    for (const entry of missing) {
      try {
        await generateHeroImage({
          workshopSlug: slug,
          painId: entry.painId,
          subject: subjectFromPrompt(entry.prompt),
          screens: screensFromPrompt(entry.prompt),
          model: "google/gemini-3-pro-image",
        });
        done += 1;
        toast.message(`Generated ${done} of ${missing.length}`);
      } catch (e) {
        toast.error(`${entry.pain}: ${(e as Error).message}`);
        break;
      }
    }
    setBatchRunning(false);
    refresh();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workshop hero images"
        description="Review every rotating hero photo and regenerate any of them from its prompt."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={slug} onValueChange={setSlug}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Choose a workshop" />
          </SelectTrigger>
          <SelectContent>
            {BUILD_WORKSHOPS.map((w) => (
              <SelectItem key={w.slug} value={w.slug}>
                {w.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary">{entries.length} pains</Badge>
        {missing.length > 0 && <Badge variant="destructive">{missing.length} missing</Badge>}

        <Button
          variant="outline"
          size="sm"
          disabled={!missing.length || batchRunning}
          onClick={regenerateMissing}
        >
          {batchRunning ? "Generating…" : `Regenerate all missing (${missing.length})`}
        </Button>
      </div>

      {rowsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading images…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <HeroImageCard
              key={entry.painId}
              entry={entry}
              onRegenerate={(prompt) => setEditing({ ...entry, promptOverride: prompt })}
              onPublish={(row) => publishM.mutate(row)}
              onRevert={(row) => revertM.mutate(row)}
              onDelete={(row) => deleteM.mutate(row)}
              onUpload={() => {
                uploadTarget.current = entry;
                fileInput.current?.click();
              }}
            />
          ))}
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file && uploadTarget.current) uploadM.mutate(file);
        }}
      />

      <HeroImageRegenerateDialog
        workshopSlug={slug}
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
      />
    </div>
  );
}
