import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type IdeaPromptProps = {
  ghostText: string;
  paused: boolean;
  onTakeOver: () => void;
};

/**
 * Glass prompt in the lower third. Shows auto-typing ghost text matching the
 * active scene until the visitor types — then it hands the field over to them.
 */
export function IdeaPrompt({ ghostText, paused, onTakeOver }: IdeaPromptProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (value.length > 0 && !paused) onTakeOver();
  }, [value, paused, onTakeOver]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const idea = value.trim();
    if (!idea) return;
    navigate(`/register?idea=${encodeURIComponent(idea)}`);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-2xl">
      <div className="hero-glass flex items-center gap-3 rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
        <div className="relative min-w-0 flex-1">
          {value.length === 0 && (
            <div
              aria-hidden="true"
              className="hero-ghost pointer-events-none absolute inset-0 flex items-center truncate"
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
        <button
          type="submit"
          disabled={value.trim().length === 0}
          className="hero-send inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          aria-label="Start with this idea"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="hero-faint mt-3 text-xs tracking-wide">
        Type your own, or watch a few. Either way, we start where you are.
      </p>
    </form>
  );
}
