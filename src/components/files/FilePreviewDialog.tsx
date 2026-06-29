import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText, Loader2 } from "lucide-react";
import { getDocumentDownloadUrl } from "@/lib/attendee.functions";

function DocxPreview({
  url,
  onError,
  expectedVisuals = false,
}: {
  url: string;
  onError: (msg: string | null) => void;
  expectedVisuals?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [visualWarning, setVisualWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVisualWarning(null);
    onError(null);
    (async () => {
      try {
        const buf = await (await fetch(url)).arrayBuffer();
        if (expectedVisuals) {
          try {
            const JSZip = (await import("jszip")).default;
            const zip = await JSZip.loadAsync(buf);
            const mediaCount = Object.keys(zip.files).filter((name) => /^word\/media\//.test(name)).length;
            const documentXml = await zip.file("word/document.xml")?.async("string");
            const hasColorFills = /w:fill="[A-Fa-f0-9]{6}"/.test(documentXml || "");
            const hasLogoAlt = /Brand logo|Primary logo|Alternate logo/.test(documentXml || "");
            if (!cancelled && (!mediaCount || !hasColorFills || !hasLogoAlt)) {
              setVisualWarning("This saved Word file does not contain the expected embedded logo and color assets. Generate and save the style guide again.");
            }
          } catch {
            // Rendering can continue; package inspection is only advisory.
          }
        }
        if (cancelled) return;
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        if (styleRef.current) styleRef.current.innerHTML = "";
        await renderAsync(buf, containerRef.current, styleRef.current ?? undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: true,
          renderHeaders: true,
          renderFooters: true,
          useBase64URL: true,
        });
      } catch (e: any) {
        if (!cancelled) onError(e?.message || "Could not render document");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div className="max-h-[72vh] overflow-auto rounded-lg bg-slate-200 p-4">
      {loading && (
        <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering document…
        </div>
      )}
      {!loading && visualWarning && (
        <div className="mb-3 rounded-lg border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-sm text-status-warning">
          {visualWarning}
        </div>
      )}
      <div ref={styleRef} />
      <div ref={containerRef} className="docx-preview-host mx-auto [&_.docx-wrapper]:bg-transparent [&_.docx-wrapper>section.docx]:mx-auto [&_.docx-wrapper>section.docx]:mb-4 [&_.docx-wrapper>section.docx]:shadow-lg" />
    </div>
  );
}

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
  // docx rendering happens in <DocxPreview /> directly from the signed URL
  const [textBody, setTextBody] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    // docx rendering is delegated to <DocxPreview />
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
          // <DocxPreview /> fetches and renders from the signed URL
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

          {!loading && url && docx && (
            <DocxPreview url={url} onError={setRenderError} expectedVisuals={/style guide/i.test(doc.original_name)} />
          )}

          {!loading && text && textBody !== null && (
            <div className="max-h-[72vh] overflow-auto rounded-lg bg-white p-6">
              <pre className="whitespace-pre-wrap break-words text-sm text-slate-900 font-mono">{textBody}</pre>
            </div>
          )}

          {!loading && url && !image && !pdf && !docx && !(text && textBody !== null) && (
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
