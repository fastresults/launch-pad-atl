import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { IdeaSnapshotModal } from "@/components/home/IdeaSnapshotModal";
import type { CatalogWorkshop } from "@/lib/workshop-catalog";

type IdeaPromptProps = {
  ghostText: string;
  paused: boolean;
  onTakeOver: () => void;
  workshop: CatalogWorkshop;
};

/**
 * The hero's glass prompt card. Auto-typing ghost text matches the active
 * scene until the visitor types — then the field is theirs. The question, the
 * caption, and the AI read it triggers all follow the selected workshop.
 */
export function IdeaPrompt({ ghostText, paused, onTakeOver, workshop }: IdeaPromptProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [snapshotIdea, setSnapshotIdea] = useState("");
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if (value.length > 0 && !paused) onTakeOver();
  }, [value, paused, onTakeOver]);

  const idea = value.trim();
  const ready = idea.length >= 3;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) {
      setHint(true);
      onTakeOver();
      inputRef.current?.focus();
      return;
    }
    setHint(false);
    setSnapshotIdea(idea);
    setSnapshotOpen(true);
  };

  return (
    <form onSubmit={submit} className="sl-prompt">
      <div className="sl-prompt__panel">
        <div className="sl-prompt__field">
          {value.length === 0 && (
            <div
              aria-hidden="true"
              className="sl-prompt__ghost"
            >
              <WorkshopIcon className="sl-prompt__ghost-icon" strokeWidth={1.75} />
              <span className="truncate">{ghostText}</span>
              <span className="sl-prompt__caret" />
            </div>
          )}
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (hint) setHint(false);
            }}
            onFocus={onTakeOver}
            aria-label={workshop.inputLabel}
            aria-invalid={hint || undefined}
            className="sl-prompt__input"
          />
        </div>
        <div className="sl-prompt__footer">
          <p aria-live="polite">
            {hint
              ? `${workshop.inputLabel} — then hit Start For Free.`
              : workshop.promptCaption}
          </p>
          <button
            type="submit"
            className="sl-prompt__submit"
            aria-disabled={!ready}
            data-inactive={!ready ? "true" : undefined}
          >
            Start For Free
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <IdeaSnapshotModal
        idea={snapshotIdea}
        workshop={workshop}
        open={snapshotOpen}
        onOpenChange={setSnapshotOpen}
      />
    </form>
  );
}
