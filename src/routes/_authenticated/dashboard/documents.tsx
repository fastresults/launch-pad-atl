// @ts-nocheck
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDocumentUploadUrl,
  deleteMyDocument,
  finalizeDocument,
  getDocumentDownloadUrl,
  listMyDocuments,
} from "@/lib/attendee.functions";
import { getVentureDocumentById } from "@/lib/foundersHub.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, Loader2, Sparkles, Upload as UploadIcon } from "lucide-react";
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

function kindLabel(k: string) {
  return KINDS.find((x) => x.key === k)?.label ?? k;
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("other");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [richDoc, setRichDoc] = useState<any | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["my", "documents"], queryFn: () => listMyDocuments() });

  const docs = useMemo(() => {
    const list = Array.isArray(data) ? data : (data?.documents ?? []);
    if (filter === "generated") return list.filter((d: any) => d.kind === "deliverable");
    if (filter === "uploaded") return list.filter((d: any) => d.kind !== "deliverable");
    return list;
  }, [data, filter]);

  const del = useMutation({
    mutationFn: (id: string) => deleteMyDocument({ id }),
    onSuccess: () => {
      toast.success("Deleted");
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
      const { uploadUrl, path } = await createDocumentUploadUrl({
        filename: f.name,
        contentType,
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
    // Rich viewer for saved deliverables that still have a source link.
    if (d.kind === "deliverable" && d.source_venture_document_id) {
      setOpeningId(d.id);
      try {
        const vdoc = await getVentureDocumentById({ id: d.source_venture_document_id });
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Uploads and deliverables you've saved from your venture, all in one place.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-card p-4">
        <UploadIcon className="h-4 w-4 text-muted-foreground" />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
        >
          {KINDS.filter((k) => k.key !== "deliverable").map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
        <input ref={fileRef} type="file" className="text-sm" />
        <Button onClick={onUpload} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>

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
                : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3 w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d: any) => {
              const generated = d.kind === "deliverable";
              return (
                <tr key={d.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{d.original_name}</td>
                  <td className="px-4 py-3">
                    {generated ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                        <Sparkles className="h-3 w-3" /> Generated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-muted-foreground">
                        Uploaded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{kindLabel(d.kind)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {Math.round((d.size_bytes ?? 0) / 1024)} KB
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onDownload(d.storage_path)}>
                      Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(d.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
            {docs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Anything you upload or save from a deliverable lands here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
