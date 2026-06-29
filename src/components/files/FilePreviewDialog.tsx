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
function isDocx(mime: string | null, name: string) {
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return true;
  return /\.docx$/i.test(name);
}
function isText(mime: string | null, name: string) {
  if (mime?.startsWith("text/")) return true;
  return /\.(md|markdown|txt|csv|log)$/i.test(name);
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
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [textBody, setTextBody] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setDocxHtml(null);
    setTextBody(null);
    setRenderError(null);
    if (!doc) return;
    setLoading(true);

    (async () => {
      try {
        const { url: signed } = await getDocumentDownloadUrl({ path: doc.storage_path });
        if (cancelled) return;
        setUrl(signed);

        if (isDocx(doc.mime_type, doc.original_name)) {
          try {
            const buf = await (await fetch(signed)).arrayBuffer();
            if (cancelled) return;
            const mammoth = await import("mammoth/mammoth.browser");
            const result = await mammoth.convertToHtml({ arrayBuffer: buf });
            if (cancelled) return;
            setDocxHtml(result.value || "<p><em>Document appears to be empty.</em></p>");
          } catch (e: any) {
            if (!cancelled) setRenderError(e?.message || "Could not render document");
          }
        } else if (isText(doc.mime_type, doc.original_name)) {
          try {
            const txt = await (await fetch(signed)).text();
            if (!cancelled) setTextBody(txt);
          } catch (e: any) {
            if (!cancelled) setRenderError(e?.message || "Could not load text");
          }
        }
      } catch {
        /* surface via Download button */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [doc?.id]);

  if (!doc) return null;
  const image = isImage(doc.mime_type, doc.original_name);
  const pdf = isPdf(doc.mime_type, doc.original_name);
  const docx = isDocx(doc.mime_type, doc.original_name);
  const text = isText(doc.mime_type, doc.original_name);

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

          {!loading && docx && docxHtml && (
            <div className="max-h-[72vh] overflow-auto rounded-lg bg-white p-8 md:p-12 shadow-inner">
              <div
                className="docx-preview mx-auto max-w-[68ch] text-slate-900 leading-relaxed text-[15px]
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3
                  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                  [&_p]:my-2
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                  [&_li]:my-1
                  [&_table]:border-collapse [&_table]:my-3 [&_table]:w-full
                  [&_td]:border [&_td]:border-slate-300 [&_td]:p-2
                  [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:text-left
                  [&_a]:text-primary [&_a]:underline
                  [&_strong]:font-semibold
                  [&_img]:max-w-full [&_img]:my-3"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
              />
            </div>
          )}

          {!loading && text && textBody !== null && (
            <div className="max-h-[72vh] overflow-auto rounded-lg bg-white p-6">
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-900 font-mono">{textBody}</pre>
            </div>
          )}

          {!loading && url && !image && !pdf && !(docx && docxHtml) && !(text && textBody !== null) && (
            <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center px-6">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <div className="text-sm text-muted-foreground max-w-md">
                {renderError
                  ? <>Couldn't render this file inline. Use <span className="font-medium text-foreground">Download</span> to open it.</>
                  : <>In-browser preview isn't available for this file type.<br /> Use <span className="font-medium text-foreground">Download</span> to open it in its native app.</>}
              </div>
              {doc.kind === "deliverable" && (
                <div className="text-xs text-muted-foreground max-w-md">
                  Tip: open the deliverable from the Hub to get the rich viewer with Markdown, DOCX, and PDF export.
                </div>
              )}
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
