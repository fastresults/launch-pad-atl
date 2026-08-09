import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Copy / download controls for a generated Website PRD.
 * Shown anywhere the PRD exists so founders can take the markdown with them.
 */
export function PrdExportActions({
  doc,
  size = "sm",
  className,
}: {
  doc: { content?: string | null; title?: string | null } | null;
  size?: "sm" | "default";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const content = doc?.content ?? "";
  if (!content) return null;

  const filename = `${(doc?.title || "website-prd")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.md`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Website PRD copied to your clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — try the .md download instead");
    }
  };

  const download = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Saved ${filename}`);
  };

  return (
    <div className={`flex shrink-0 flex-wrap gap-2 ${className ?? ""}`}>
      <Button size={size} variant="outline" onClick={copy}>
        {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy markdown"}
      </Button>
      <Button size={size} variant="outline" onClick={download}>
        <Download className="mr-1 h-3.5 w-3.5" />
        Save .md
      </Button>
    </div>
  );
}
