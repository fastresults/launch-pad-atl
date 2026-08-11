import { useMemo, useRef, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ArrowLeft, RotateCcw, Loader2, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { ScaledSlide } from "@/components/workshop-slides/ScaledSlide";
import { DeckOverridesProvider, slotKey, type SlotMap } from "@/components/workshop-slides/slots";
import { getDeck } from "@/components/workshop-slides/registry";
import {
  fetchDeckOverrides,
  resetDeck,
} from "@/lib/deck-overrides.functions";
import { SlotInspector, type SlotDescriptor } from "@/components/admin/decks/SlotInspector";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function AdminDeckEditorPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const deck = getDeck(slug);
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const confirm = useConfirm();

  // Capture slot defaults as slides render (so the inspector knows what's editable).
  const descriptorsRef = useRef<Map<string, SlotDescriptor>>(new Map());
  const [descriptorsVersion, setDescriptorsVersion] = useState(0);

  const { data: overrides = {} as SlotMap, isLoading } = useQuery({
    queryKey: ["deck-overrides", slug],
    queryFn: () => fetchDeckOverrides(slug),
    enabled: !!slug,
  });

  const resetMut = useMutation({
    mutationFn: () => resetDeck(slug),
    onSuccess: () => {
      toast.success("Deck reset to defaults");
      qc.invalidateQueries({ queryKey: ["deck-overrides", slug] });
      qc.invalidateQueries({ queryKey: ["deck-override-counts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!deck) return <Navigate to="/admin/decks" replace />;
  if (!deck.available) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <AdminPageHeader title={deck.title} description="This deck has not been authored yet." />
        <Link to="/admin/decks" className="text-sm text-primary">
          ← Back to decks
        </Link>
      </div>
    );
  }

  const slide = deck.slides[index];

  const onSlotMount = (
    key: string,
    info: { kind: "text" | "image"; text?: string | null; imageUrl?: string | null; imageAlt?: string | null },
  ) => {
    const existing = descriptorsRef.current.get(key);
    if (existing) return;
    descriptorsRef.current.set(key, {
      key,
      slideId: slide.id,
      field: key.split("::")[1]?.replace(`${slide.id}.`, "") ?? key,
      kind: info.kind,
      defaultText: info.text ?? undefined,
      defaultImageUrl: info.imageUrl ?? undefined,
      defaultImageAlt: info.imageAlt ?? undefined,
    });
    // Defer state bump to next tick to avoid setState-during-render.
    queueMicrotask(() => setDescriptorsVersion((v) => v + 1));
  };

  // Filter descriptors that belong to the current slide.
  const slideDescriptors = useMemo(() => {
    const prefix = slotKey(slug, slide.id, "");
    void descriptorsVersion;
    return Array.from(descriptorsRef.current.values()).filter((d) => d.key.startsWith(prefix));
  }, [descriptorsVersion, slug, slide.id]);

  // Clear descriptors when switching slides so we always reflect current slide only.
  const gotoSlide = (i: number) => {
    descriptorsRef.current.clear();
    setIndex(Math.min(Math.max(i, 0), deck.slides.length - 1));
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin/decks">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Decks
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="text-xs uppercase text-muted-foreground">
                {deck.stageNumber} · Facilitator deck
              </div>
              <div className="truncate text-base font-semibold">{deck.title}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (await confirm({ title: "Reset deck?", description: "Reset every override on this deck back to defaults.", destructive: true, confirmText: "Reset" })) {
                  resetMut.mutate();
                }
              }}
              disabled={resetMut.isPending}
              className="gap-1"
            >
              {resetMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Reset deck
            </Button>
          </div>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-[1fr_420px]">
        {/* Preview */}
        <div className="flex flex-col bg-neutral-900">
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0">
              <DeckOverridesProvider
                deckSlug={slug}
                overrides={overrides}
                onSlotMount={onSlotMount}
              >
                <ScaledSlide key={`${index}-${Object.keys(overrides).length}`}>
                  {slide.render()}
                </ScaledSlide>
              </DeckOverridesProvider>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border bg-neutral-950 px-4 py-2 text-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => gotoSlide(index - 1)}
              disabled={index === 0}
              className="text-white hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <div className="text-sm">
              <span className="font-medium">{index + 1}</span>
              <span className="text-muted-foreground"> / {deck.slides.length}</span>
              <span className="ml-3 text-muted-foreground">{slide.title}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => gotoSlide(index + 1)}
              disabled={index === deck.slides.length - 1}
              className="text-white hover:bg-muted"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Inspector */}
        <div className="border-l bg-background overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading overrides…
            </div>
          ) : (
            <SlotInspector
              deckSlug={slug}
              slideId={slide.id}
              slideTitle={slide.title}
              descriptors={slideDescriptors}
              overrides={overrides}
            />
          )}
        </div>
      </div>
    </div>
  );
}
