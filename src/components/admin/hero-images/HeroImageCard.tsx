import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { HeroImageRow } from "@/lib/workshop-hero-images.functions";
import type { HeroPainEntry } from "@/routes/_authenticated/_admin/admin.hero-images";

type Props = {
  entry: HeroPainEntry;
  onRegenerate: (prompt: string) => void;
  onPublish: (row: HeroImageRow) => void;
  onRevert: (row: HeroImageRow) => void;
  onDelete: (row: HeroImageRow) => void;
  onUpload: () => void;
};

/**
 * One pain: the picture currently on the public hero, the question typed with
 * it, the prompt behind it, and every earlier take.
 */
export function HeroImageCard({
  entry,
  onRegenerate,
  onPublish,
  onRevert,
  onDelete,
  onUpload,
}: Props) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const sourcePrompt = entry.published?.prompt ?? entry.prompt;
  const [prompt, setPrompt] = useState(sourcePrompt);
  const live = entry.published?.image_url ?? entry.bundled;

  useEffect(() => setPrompt(sourcePrompt), [sourcePrompt]);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-video bg-muted">
        {live ? (
          <img src={live} alt={entry.pain} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image yet
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {entry.published ? (
            <Badge>Override active</Badge>
          ) : entry.bundled ? (
            <Badge variant="secondary">Bundled</Badge>
          ) : (
            <Badge variant="destructive">Missing image</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="font-medium leading-snug">{entry.pain}</p>
          {entry.question && (
            <p className="mt-1 text-sm italic text-muted-foreground">"{entry.question}"</p>
          )}
        </div>

        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto self-start p-0 text-xs text-muted-foreground"
          onClick={() => setShowPrompt((v) => !v)}
        >
          {showPrompt ? "Hide prompt" : "Show prompt"}
        </Button>
        {showPrompt && (
          <Textarea
            aria-label={`Prompt for ${entry.pain}`}
            rows={12}
            value={prompt}
            className="text-sm leading-relaxed"
            onChange={(event) => setPrompt(event.target.value)}
          />
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onRegenerate(prompt)} disabled={!prompt.trim()}>
            Regenerate
          </Button>
          <Button size="sm" variant="outline" onClick={onUpload}>
            Upload
          </Button>
          {entry.published && (
            <Button size="sm" variant="ghost" onClick={() => onRevert(entry.published!)}>
              Revert to bundled
            </Button>
          )}
          {entry.history.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? "Hide takes" : `Takes (${entry.history.length})`}
            </Button>
          )}
        </div>

        {showHistory && (
          <div className="grid grid-cols-3 gap-2">
            {entry.history.map((row) => (
              <div key={row.id} className="space-y-1">
                <img
                  src={row.image_url}
                  alt={`Earlier take for ${entry.pain}`}
                  className="aspect-video w-full rounded object-cover"
                  loading="lazy"
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 flex-1 px-1 text-[10px]"
                    onClick={() => onPublish(row)}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1 text-[10px]"
                    onClick={() => onDelete(row)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
