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
    <form onSubmit={submit} className="hero-prompt-form mx-auto w-full max-w-[940px]">
      <div className="hero-glass flex flex-col justify-between rounded-3xl p-6 text-left sm:p-8">

        <div className="relative flex min-w-0 flex-1 items-center">
          {value.length === 0 && (
            <div
              aria-hidden="true"
              className="hero-ghost pointer-events-none absolute inset-0 flex items-center"
            >
              <span className="truncate">{ghostText}</span>
              <span className="hero-caret" />
            </div>
          )}
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={onTakeOver}
            aria-label="Tell us what you want to start"
            className="hero-input w-full py-1"
          />
        </div>


        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="hero-faint text-sm">We build it. You own it.</p>
          <button type="submit" className="hero-cta">
            Start For Free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <IdeaSnapshotModal idea={snapshotIdea} open={snapshotOpen} onOpenChange={setSnapshotOpen} />
    </form>
  );
}
