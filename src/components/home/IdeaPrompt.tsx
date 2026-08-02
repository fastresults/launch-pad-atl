import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { IdeaSnapshotModal } from "@/components/home/IdeaSnapshotModal";

type IdeaPromptProps = {
  ghostText: string;
  paused: boolean;
  onTakeOver: () => void;
};

/**
 * The hero's glass prompt card. Auto-typing ghost text matches the active
 * scene until the visitor types — then the field is theirs. The card carries
 * its own caption and CTA along its bottom edge.
 */
export function IdeaPrompt({ ghostText, paused, onTakeOver }: IdeaPromptProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [snapshotIdea, setSnapshotIdea] = useState("");
  const [snapshotOpen, setSnapshotOpen] = useState(false);

  useEffect(() => {
    if (value.length > 0 && !paused) onTakeOver();
  }, [value, paused, onTakeOver]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const idea = (value.trim() || ghostText.trim()).replace(/\|$/, "");
    if (!idea) return;
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
              <span className="truncate">{ghostText}</span>
              <span className="sl-prompt__caret" />
            </div>
          )}
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={onTakeOver}
            aria-label="Tell us what you want to start"
            className="sl-prompt__input"
          />
        </div>
        <div className="sl-prompt__footer">
          <p>We build it. You own it.</p>
          <button type="submit" className="sl-prompt__submit">
            Start For Free
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <IdeaSnapshotModal idea={snapshotIdea} open={snapshotOpen} onOpenChange={setSnapshotOpen} />
    </form>
  );
}
