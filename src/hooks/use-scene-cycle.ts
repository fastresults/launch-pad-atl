import { useEffect, useState } from "react";

type Phase = "typing" | "holding" | "deleting";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

const CYCLE_MS = 7000;
const TYPE_MS = 55;
const ERASE_MS = 22;
const GAP_MS = 320;

/**
 * Types each phrase out character by character, holds, deletes, then moves to
 * the next one — one full scenario every 7 seconds. `active` pauses the loop
 * (used when the visitor takes over the input).
 */
export function useSceneCycle(phrases: string[], active: boolean) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    if (!active || phrases.length === 0) return;
    const full = phrases[index % phrases.length] ?? "";

    if (reducedMotion) {
      setTyped(full);
      const timer = setTimeout(() => {
        setIndex((value) => (value + 1) % phrases.length);
      }, CYCLE_MS);
      return () => clearTimeout(timer);
    }

    const holdMs = Math.max(
      800,
      CYCLE_MS - full.length * (TYPE_MS + ERASE_MS) - GAP_MS,
    );

    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      timer =
        typed.length < full.length
          ? setTimeout(() => setTyped(full.slice(0, typed.length + 1)), TYPE_MS)
          : setTimeout(() => setPhase("holding"), holdMs);
    } else if (phase === "holding") {
      timer = setTimeout(() => setPhase("deleting"), 0);
    } else if (typed.length > 0) {
      timer = setTimeout(() => setTyped(typed.slice(0, -1)), ERASE_MS);
    } else {
      timer = setTimeout(() => {
        setIndex((value) => (value + 1) % phrases.length);
        setPhase("typing");
      }, GAP_MS);
    }

    return () => clearTimeout(timer);
  }, [active, index, phase, phrases, reducedMotion, typed]);

  return { typed, index: index % Math.max(phrases.length, 1), reducedMotion };
}
