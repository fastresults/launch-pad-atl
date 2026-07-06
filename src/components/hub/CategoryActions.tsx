// @ts-nocheck
import { MoreHorizontal, Presentation, RefreshCw, Sparkles, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DeckState = {
  slug: string;
  unlocked: boolean;
  available: boolean;
  prevLabel?: string | null;
} | null | undefined;

interface Props {
  mode: "guided" | "advanced";
  deck: DeckState;
  catDone: number;
  catComplete: boolean;
  catGenerating: boolean;
  disabled: boolean;
  onOpenDeck: (slug: string) => void;
  onRegenerate: () => void;
  catLabel: string;
}

export function CategoryActions({
  mode,
  deck,
  catDone,
  catComplete,
  catGenerating,
  disabled,
  onOpenDeck,
  onRegenerate,
  catLabel,
}: Props) {
  const deckBtn = deck && (
    deck.unlocked && deck.available ? (
      <Button size="sm" variant="outline" onClick={() => onOpenDeck(deck.slug)}>
        <Presentation className="mr-1 h-3 w-3" />
        Open facilitator deck
      </Button>
    ) : !deck.available ? (
      <Button size="sm" variant="outline" disabled title="Deck coming soon">
        <Lock className="mr-1 h-3 w-3" />
        Deck coming soon
      </Button>
    ) : (
      <Button
        size="sm"
        variant="outline"
        disabled
        title={`Deck unlocks when ${deck.prevLabel ?? "the previous section"} is complete`}
      >
        <Lock className="mr-1 h-3 w-3" />
        Unlocks after {deck.prevLabel ?? "previous section"}
      </Button>
    )
  );

  const regenBtn = (
    <Button
      size="sm"
      variant={catComplete ? "ghost" : "outline"}
      disabled={disabled}
      onClick={onRegenerate}
    >
      {catGenerating ? (
        <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Writing {catLabel}…</>
      ) : catDone > 0 ? (
        <><RefreshCw className="mr-1 h-3 w-3" />Regenerate this section</>
      ) : (
        <><Sparkles className="mr-1 h-3 w-3" />Generate this section</>
      )}
    </Button>
  );

  if (mode === "advanced") {
    return <>{deckBtn}{regenBtn}</>;
  }

  // Guided: overflow menu only. The row itself is the primary action (click to expand).
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={`${catLabel} options`}
          onClick={(e) => e.stopPropagation()}
        >
          {catGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {deck && deck.unlocked && deck.available && (
          <DropdownMenuItem onClick={() => onOpenDeck(deck.slug)}>
            <Presentation className="mr-2 h-4 w-4" />
            Open facilitator deck
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={disabled} onClick={onRegenerate}>
          {catDone > 0 ? (
            <><RefreshCw className="mr-2 h-4 w-4" />Regenerate section</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />Generate section</>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
