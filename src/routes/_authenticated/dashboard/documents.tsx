// @ts-nocheck
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDocumentUploadUrl,
  deleteMyDocument,
  finalizeDocument,
  getDocumentDownloadUrl,
  listMyDocuments,
  updateDocumentVenture,
} from "@/lib/attendee.functions";
import {
  findVentureDocumentByLabel,
  getVentureDocumentById,
  listSnapshots,
} from "@/lib/foundersHub.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Eye, Loader2, Sparkles, Upload as UploadIcon, FolderInput } from "lucide-react";
import { toast } from "sonner";
import { DocumentViewer } from "@/components/hub/DocumentViewer";
import { FilePreviewDialog } from "@/components/files/FilePreviewDialog";

const KINDS = [
  { key: "pitch_deck", label: "Pitch deck" },
  { key: "business_plan", label: "Startup plan" },
  { key: "logo", label: "Logo" },
  { key: "deliverable", label: "Saved deliverable" },
  { key: "other", label: "Other" },
] as const;

type Filter = "all" | "generated" | "uploaded";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "generated", label: "Generated" },
  { key: "uploaded", label: "Uploaded" },
];

const UNASSIGNED = "__unassigned__";

function kindLabel(k: string) {
  return KINDS.find((x) => x.key === k)?.label ?? k;
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const ventureFilter = searchParams.get("venture") ?? "all"; // "all" | "__unassigned__" | snapshotId
  const setVentureFilter = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === "all") next.delete("venture");
    else next.set("venture", v);
    setSearchParams(next, { replace: true });
  };

  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("other");
  const [uploadSnapshotId, setUploadSnapshotId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [richDoc, setRichDoc] = useState<any | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["my", "documents"], queryFn: () => listMyDocuments() });
  const { data: snapshots = [] } = useQuery({
    queryKey: ["my", "snapshots", "list"],
    queryFn: () => listSnapshots(),
  });

  const ventureNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of snapshots) m.set(s.id, s.company_name || "Untitled venture");
    return m;
  }, [snapshots]);

  const docs = useMemo(() => {
    const list = Array.isArray(data) ? data : (data?.documents ?? []);
    let out = list;
    if (filter === "generated") out = out.filter((d: any) => d.kind === "deliverable");
    else if (filter === "uploaded") out = out.filter((d: any) => d.kind !== "deliverable");
    if (ventureFilter === UNASSIGNED) out = out.filter((d: any) => !d.snapshot_id);
    else if (ventureFilter !== "all") out = out.filter((d: any) => d.snapshot_id === ventureFilter);
    return out;
  }, [data, filter, ventureFilter]);

  const del = useMutation({
    mutationFn: (id: string) => deleteMyDocument({ id }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["my", "documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: (args: { id: string; snapshotId: string | null }) => updateDocumentVenture(args),
    onSuccess: () => {
      toast.success("Moved");
      qc.invalidateQueries({ queryKey: ["my", "documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onUpload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const contentType = f.type || "application/octet-stream";
      const snapshotId = uploadSnapshotId || null;
      const { uploadUrl, path } = await createDocumentUploadUrl({
        filename: f.name,
        contentType,
        snapshotId,
      });
      const up = await fetch(uploadUrl, {
        method: "PUT",
        body: f,
        headers: { "Content-Type": contentType },
      });
      if (!up.ok) throw new Error("Upload failed");
      await finalizeDocument({
        kind,
        path,
        label: f.name,
        size: f.size,
        contentType,
        snapshotId,
      });
      toast.success("Uploaded");
      qc.invalidateQueries({ queryKey: ["my", "documents"] });
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (path: string) => {
    const { url } = await getDocumentDownloadUrl({ path });
    window.open(url, "_blank");
  };

  const onView = async (d: any) => {
    if (d.kind === "deliverable") {
      setOpeningId(d.id);
      try {
        let vdoc = d.source_venture_document_id
          ? await getVentureDocumentById({ id: d.source_venture_document_id })
          : null;
        if (!vdoc) {
          vdoc = await findVentureDocumentByLabel({ label: d.original_name ?? "" });
          if (vdoc) {
            await supabase
              .from("attendee_documents")
              .update({ source_venture_document_id: vdoc.id })
              .eq("id", d.id);
            qc.invalidateQueries({ queryKey: ["my", "documents"] });
          }
        }
        if (vdoc) {
          setRichDoc(vdoc);
          return;
        }
        toast.message("Original source not found", {
          description: "Showing the saved file instead.",
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't load the source document");
      } finally {
        setOpeningId(null);
      }
    }
    setPreviewDoc(d);
  };

  const ventureChip = (key: string, label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setVentureFilter(key)}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition",
        ventureFilter === key
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each startup gets its own folder. Switch ventures below or save files unassigned.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <UploadIcon className="h-4 w-4 text-muted-foreground" />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {KINDS.filter((k) => k.key !== "deliverable").map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
        {snapshots.length > 0 && (
          <select
            value={uploadSnapshotId}
            onChange={(e) => setUploadSnapshotId(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            title="Save to which venture"
          >
            <option value="">Unassigned</option>
            {snapshots.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.company_name || "Untitled venture"}
              </option>
            ))}
          </select>
        )}
        <input ref={fileRef} type="file" className="text-sm" />
        <Button onClick={onUpload} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>

      {snapshots.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {ventureChip("all", "All ventures")}
          {snapshots.map((s: any) =>
            ventureChip(s.id, s.company_name || "Untitled venture"),
          )}
          {ventureChip(UNASSIGNED, "Unassigned")}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              filter === f.key
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Venture</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3 w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d: any) => {
              const generated = d.kind === "deliverable";
              const ventureName = d.snapshot_id ? ventureNameById.get(d.snapshot_id) : null;
              return (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-4 py-3">{d.original_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ventureName ? (
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px]">
                        {ventureName}
                      </span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground/60">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {generated ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                        <Sparkles className="h-3 w-3" /> Generated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        Uploaded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{kindLabel(d.kind)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {Math.round((d.size_bytes ?? 0) / 1024)} KB
                  </td>
                  <td className="px-4 py-3 space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(d)}
                      disabled={openingId === d.id}
                    >
                      {openingId === d.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Eye className="mr-1 h-3 w-3" />
                      )}
                      View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDownload(d.storage_path)}>
                      Download
                    </Button>
                    {snapshots.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost" title="Move to venture">
                            <FolderInput className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-56 p-1">
                          <button
                            type="button"
                            className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted/40"
                            onClick={() => move.mutate({ id: d.id, snapshotId: null })}
                          >
                            Unassigned
                          </button>
                          {snapshots.map((s: any) => (
                            <button
                              key={s.id}
                              type="button"
                              className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted/40"
                              onClick={() => move.mutate({ id: d.id, snapshotId: s.id })}
                            >
                              {s.company_name || "Untitled venture"}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(d.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {ventureFilter !== "all"
                    ? "Nothing saved for this venture yet — open a deliverable and hit Save to My Files."
                    : "Anything you upload or save from a deliverable lands here."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DocumentViewer
        doc={richDoc}
        open={!!richDoc}
        onOpenChange={(o) => { if (!o) setRichDoc(null); }}
        autoGenerateHero={false}
      />
      <FilePreviewDialog
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDelete={(id) => del.mutate(id)}
      />
    </div>
  );
}
