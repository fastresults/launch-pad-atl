import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, HardDrive, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  FILE_META,
  downloadBlob,
  driveEnabled,
  renderExport,
  uploadToDrive,
  type ExportDoc,
  type ExportFormat,
} from "@/lib/share-export";

/**
 * Discreet export control shown on every showcase section: Word, PDF, or
 * straight into the visitor's own Google Drive — images included.
 */
export function SectionExportMenu({
  build,
  label = "Export",
  className,
  variant = "icon",
}: {
  /** Assembles the export model on demand (images fetched lazily). */
  build: () => Promise<ExportDoc>;
  label?: string;
  className?: string;
  variant?: "icon" | "button" | "pill" | "primary";
}) {
  const [busy, setBusy] = useState(false);

  const run = async (format: ExportFormat, drive: boolean) => {
    if (busy) return;
    setBusy(true);
    const toastId = toast.loading(drive ? "Preparing for Google Drive…" : "Preparing your file…");
    try {
      const doc = await build();
      const { blob, filename } = await renderExport(doc, format);
      if (drive) {
        try {
          const file = await uploadToDrive(blob, filename, FILE_META[format].mime);
          toast.success("Saved to your Google Drive", {
            id: toastId,
            description: filename,
            action: file.webViewLink
              ? {
                  label: "Open",
                  onClick: () => window.open(file.webViewLink, "_blank", "noopener"),
                }
              : undefined,
          });
          return;
        } catch (e: any) {
          // A cancelled Google prompt should still leave them with the file.
          downloadBlob(blob, filename);
          toast.message("Downloaded instead", {
            id: toastId,
            description: e?.message ?? "Google Drive wasn't available.",
          });
          return;
        }
      }
      downloadBlob(blob, filename);
      toast.success("Download ready", { id: toastId, description: filename });
    } catch (e: any) {
      toast.error("Export failed", { id: toastId, description: e?.message ?? "Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:opacity-100 md:opacity-60 md:hover:opacity-100",
            variant === "icon" ? "h-9 w-9 justify-center" : "h-9 px-3 text-[12px]",
            className,
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {variant === "button" && <span>{label}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="theme-dark-scope w-52">
        <DropdownMenuItem onSelect={() => void run("docx", false)}>
          <FileText className="mr-2 h-4 w-4" />
          Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void run("pdf", false)}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </DropdownMenuItem>
        {driveEnabled() && (
          <DropdownMenuItem onSelect={() => void run("pdf", true)}>
            <HardDrive className="mr-2 h-4 w-4" />
            Save to Google Drive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SectionExportMenu;
