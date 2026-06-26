import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText, Loader2 } from "lucide-react";
import { getDocumentDownloadUrl } from "@/lib/attendee.functions";

type Doc = {
  id: string;
  original_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  kind: string;
};

function isImage(mime: string | null, name: string) {
  if (mime?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
}
function isPdf(mime: string | null, name: string) {
  return mime === "application/pdf" || /\.pdf$/i.test(name);
}

export function FilePreviewDialog({
  doc,
  onClose,
  onDelete,
}: {
  doc: Doc | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!doc) return;
    setLoading(true);
    getDocumentDownloadUrl({ path: doc.storage_path })
      .then((res) => { if (!cancelled) setUrl(res.url); })
      .catch(() => { /* surface via Download button */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [doc?.id]);

  if (!doc) return null;
  const image = isImage(doc.mime_type, doc.original_name);
  const pdf = isPdf(doc.mime_type, doc.original_name);

  return (
    <Dialog open={!!doc} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{doc.original_name}</DialogTitle>
          <DialogDescription>
            {Math.round((doc.size_bytes ?? 0) / 1024)} KB · {doc.mime_type ?? "file"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[420px] rounded-xl border border-white/10 bg-background/40 p-2">
          {loading && (
            <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading preview…
            </div>
          )}
          {!loading && url && image && (
            <img src={url} alt={doc.original_name} className="mx-auto max-h-[70vh] rounded-lg" />
          )}
          {!loading && url && pdf && (
            <iframe src={url} title={doc.original_name} className="h-[70vh] w-full rounded-lg bg-white" />
          )}
          {!loading && url && !image && !pdf && (
            <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                In-browser preview isn't available for this file type.
                <br /> Use Download to open it in its native app.
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {onDelete && (
            <Button
              variant="ghost"
              onClick={() => { onDelete(doc.id); onClose(); }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          )}
          <Button
            disabled={!url}
            onClick={() => url && window.open(url, "_blank")}
          >
            <Download className="mr-1.5 h-4 w-4" /> Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
