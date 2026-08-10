// Owner-only controls on a public showcase.
//
// A founder (or an admin) reading their own share link should not have to walk
// back into the hub to fix an asset they can see is wrong. When the share
// payload marks the viewer as a manager, each asset gets a discreet menu that
// regenerates or deletes it in place.

import { useState } from "react";
import { MoreVertical, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearCollateral, generateCollateral } from "@/lib/collateral.functions";
import { generateDocument } from "@/lib/foundersHub.functions";

type Handlers = {
  label: string;
  regenerate: (snapshotId: string) => Promise<unknown>;
  remove: (snapshotId: string) => Promise<unknown>;
};

/** Map a showcase item key onto the real generate / delete calls behind it. */
function handlersFor(itemKey: string): Handlers | null {
  if (itemKey === "brand:collateral") {
    return {
      label: "brand collateral",
      regenerate: (id) => generateCollateral(id),
      remove: (id) => clearCollateral(id),
    };
  }
  if (itemKey.startsWith("doc:")) {
    const documentType = itemKey.slice(4);
    return {
      label: "asset",
      regenerate: (id) => generateDocument({ snapshotId: id, documentType }),
      remove: async (id) => {
        const { error } = await supabase
          .from("venture_documents")
          .delete()
          .eq("snapshot_id", id)
          .eq("document_type", documentType);
        if (error) throw new Error(error.message);
      },
    };
  }
  return null;
}

export function OwnerAssetActions({
  itemKey,
  snapshotId,
  onChanged,
}: {
  itemKey: string;
  snapshotId: string;
  /** Reload the payload so the reader reflects what just changed. */
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState<"regenerate" | "delete" | null>(null);
  const h = handlersFor(itemKey);
  if (!h) return null;

  const run = async (mode: "regenerate" | "delete") => {
    setBusy(mode);
    try {
      if (mode === "regenerate") {
        await h.regenerate(snapshotId);
        toast.success(`Regenerating your ${h.label} — refresh in a moment to see it.`);
      } else {
        await h.remove(snapshotId);
        toast.success(`Deleted this ${h.label}.`);
      }
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message || "That didn't go through. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Manage this asset"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem disabled={!!busy} onSelect={() => void run("regenerate")}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!!busy}
          className="text-destructive focus:text-destructive"
          onSelect={() => void run("delete")}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default OwnerAssetActions;
