// @ts-nocheck
import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileStack, Loader2, Trash2, RotateCw, ExternalLink, Link2, Pencil,
  ChevronDown, ChevronRight, UploadCloud,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePrompt, useConfirm } from "@/components/ui/confirm-dialog";
import {
  listBrainMaterials, uploadBrainMaterial, addBrainMaterialLink, retryBrainMaterial,
  renameBrainMaterial, deleteBrainMaterial, getBrainMaterialUrl,
  MATERIAL_MAX_BYTES, type BrainMaterial,
} from "@/lib/brain-materials.functions";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  uploading: "Uploading",
  reading: "Reading",
  understanding: "Understanding",
  indexing: "Adding to brain",
  ready: "In your brain",
  failed: "Failed",
};

const WORKING = new Set(["queued", "uploading", "reading", "understanding", "indexing"]);
const STALL_MS = 3 * 60 * 1000;

/** A material still "working" long after its last update is stuck, not busy. */
function isStalled(m: any) {
  if (!WORKING.has(m.status)) return false;
  const last = new Date(m.updated_at ?? m.created_at).getTime();
  return Number.isFinite(last) && Date.now() - last > STALL_MS;
}


function prettySize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BrainMaterials({
  userId,
  snapshotId,
}: {
  userId: string;
  snapshotId: string | null;
}) {
  const qc = useQueryClient();
  const prompt = usePrompt();
  const confirm = useConfirm();
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: materials = [] } = useQuery({
    queryKey: ["brain", "materials", userId, snapshotId],
    queryFn: () => listBrainMaterials(userId, snapshotId),
    enabled: !!userId,
    refetchInterval: (q) =>
      (q.state.data ?? []).some((m: BrainMaterial) => WORKING.has(m.status)) ? 3000 : false,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["brain", "materials", userId, snapshotId] });
    qc.invalidateQueries({ queryKey: ["brain", "status", userId, snapshotId] });
  }, [qc, userId, snapshotId]);

  const working = useMemo(() => materials.filter((m) => WORKING.has(m.status)).length, [materials]);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    let ok = 0;
    for (const file of list) {
      try {
        if (file.size > MATERIAL_MAX_BYTES) {
          toast.error(`${file.name} is over 25MB.`);
          continue;
        }
        await uploadBrainMaterial(userId, file, snapshotId);
        ok++;
        invalidate();
      } catch (e: any) {
        toast.error(e?.message ?? `Couldn't add ${file.name}`);
      }
    }
    setBusy(false);
    setDragOver(false);
    if (ok) toast.success(`Reading ${ok} file${ok === 1 ? "" : "s"} into your brain…`);
    invalidate();
  }

  async function addLink() {
    const url = await prompt({
      title: "Add a link",
      description: "Paste a public URL — an article, a competitor page, your own site.",
      placeholder: "https://…",
      confirmText: "Add",
    });
    if (!url) return;
    try {
      await addBrainMaterialLink(userId, url, snapshotId);
      toast.success("Reading that page into your brain…");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't add that link");
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileStack className="h-4 w-4 text-primary" /> Materials ({materials.length})
        </div>
        {working > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> {working} processing
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-3 cursor-pointer rounded-xl border-2 border-dashed border-border/70 bg-background/40 px-3 py-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5",
          dragOver && "border-primary bg-primary/10",
          busy && "opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
        {busy ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
          </span>
        ) : (
          <>
            <UploadCloud className={cn("mx-auto h-6 w-6 text-muted-foreground", dragOver && "text-primary")} />
            <p className="mt-2 text-xs font-medium">
              {dragOver ? "Drop it in" : "Drop anything your startup runs on"}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              PDFs, contracts, decks, spreadsheets, screenshots, notes — up to 25MB each.
              Read and filed automatically.
            </p>
          </>
        )}
      </div>

      <Button size="sm" variant="ghost" className="mt-2 w-full justify-start text-xs" onClick={addLink}>
        <Link2 className="mr-2 h-3.5 w-3.5" /> Or add a link
      </Button>

      <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {materials.length === 0 && (
          <li className="text-[11px] text-muted-foreground">
            Nothing added yet. Anything you drop here stays in your brain — add more any time.
          </li>
        )}
        {materials.map((m) => (
          <li key={m.id} className="rounded-lg border border-border/60 bg-background/60 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold" title={m.title}>{m.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {[m.doc_kind, prettySize(m.byte_size), m.source_type === "link" ? "link" : null]
                    .filter(Boolean).join(" · ")}
                </p>
              </div>
              <Badge
                variant={m.status === "failed" || isStalled(m) ? "destructive" : m.status === "ready" ? "secondary" : "outline"}
                className="shrink-0 text-[9px]"
              >
                {WORKING.has(m.status) && !isStalled(m) && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />}
                {isStalled(m) ? "Stalled" : STATUS_LABEL[m.status] ?? m.status}
              </Badge>

            </div>

            {m.summary && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{m.summary}</p>}

            {m.tags?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {m.tags.map((t) => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{t}</span>
                ))}
              </div>
            )}

            {m.status === "failed" && m.error_message && (
              <p className="mt-1.5 text-[10px] text-destructive">{m.error_message}</p>
            )}

            {(m.key_points?.length > 0 || m.extracted_text) && (
              <button
                type="button"
                onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              >
                {expanded === m.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                What the brain took from this
              </button>
            )}

            {expanded === m.id && (
              <div className="mt-1.5 space-y-1.5">
                {m.key_points?.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-4 text-[10px] leading-snug text-muted-foreground">
                    {m.key_points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                )}
                {m.extracted_text && (
                  <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-muted/60 p-2 text-[10px] leading-snug text-muted-foreground">
                    {m.extracted_text.slice(0, 4000)}
                  </pre>
                )}
                {m.chunk_count > 0 && (
                  <p className="text-[10px] text-muted-foreground">{m.chunk_count} memory chunks indexed.</p>
                )}
              </div>
            )}

            <div className="mt-2 flex items-center gap-1">
              {m.status === "failed" && (
                <Button
                  size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                  onClick={async () => {
                    try { await retryBrainMaterial(m.id); invalidate(); } catch (e: any) { toast.error(e?.message ?? "Retry failed"); }
                  }}
                >
                  <RotateCw className="mr-1 h-3 w-3" /> Retry
                </Button>
              )}
              <Button
                size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                onClick={async () => {
                  const next = await prompt({ title: "Rename material", defaultValue: m.title, confirmText: "Save" });
                  if (!next) return;
                  await renameBrainMaterial(m.id, next);
                  invalidate();
                }}
              >
                <Pencil className="mr-1 h-3 w-3" /> Rename
              </Button>
              <Button
                size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                onClick={async () => {
                  const url = await getBrainMaterialUrl(m);
                  if (url) window.open(url, "_blank", "noopener");
                  else toast.error("No file to open");
                }}
              >
                <ExternalLink className="mr-1 h-3 w-3" /> Open
              </Button>
              <Button
                size="sm" variant="ghost"
                className="ml-auto h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Remove this material?",
                    description: "Its memory is removed from your brain. Everything else stays.",
                    confirmText: "Remove",
                    destructive: true,
                  });
                  if (!ok) return;
                  await deleteBrainMaterial(m);
                  invalidate();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
