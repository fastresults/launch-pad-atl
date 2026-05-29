import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createDocumentUploadUrl,
  deleteMyDocument,
  finalizeDocument,
  getDocumentDownloadUrl,
  listMyDocuments,
} from "@/lib/attendee.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/documents")({
  component: DocumentsPage,
});

const KINDS = [
  { key: "pitch_deck", label: "Pitch deck" },
  { key: "business_plan", label: "Startup plan" },
  { key: "logo", label: "Logo" },
  { key: "other", label: "Other" },
] as const;

function DocumentsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyDocuments);
  const signFn = useServerFn(createDocumentUploadUrl);
  const finalizeFn = useServerFn(finalizeDocument);
  const delFn = useServerFn(deleteMyDocument);
  const dlFn = useServerFn(getDocumentDownloadUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("other");
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({ queryKey: ["my", "documents"], queryFn: () => listFn() });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
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
      const { signedUrl, path } = await signFn({
        data: { kind, filename: f.name, mime: f.type || "application/octet-stream" },
      });
      const up = await fetch(signedUrl, { method: "PUT", body: f, headers: { "Content-Type": f.type || "application/octet-stream" } });
      if (!up.ok) throw new Error("Upload failed");
      await finalizeFn({
        data: {
          kind,
          storage_path: path,
          original_name: f.name,
          size_bytes: f.size,
          mime_type: f.type || "application/octet-stream",
        },
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

  const onDownload = async (id: string) => {
    const { url } = await dlFn({ data: { id } });
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload pitch decks, plans, logos.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-card p-4">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
        >
          {KINDS.map((k) => (
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

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3 w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.documents ?? []).map((d) => (
              <tr key={d.id} className="border-t border-white/5">
                <td className="px-4 py-3">{d.original_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{d.kind}</td>
                <td className="px-4 py-3 text-muted-foreground">{Math.round((d.size_bytes ?? 0) / 1024)} KB</td>
                <td className="px-4 py-3 space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onDownload(d.id)}>Download</Button>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate(d.id)}>Delete</Button>
                </td>
              </tr>
            ))}
            {data && data.documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No documents yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
