import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AiCapacityDialog } from "@/components/system/AiCapacityDialog";
import { parseCapacityError, type CapacityInfo } from "@/lib/ai-capacity";
import { registerCapacityHandler } from "@/lib/edge-errors";

type OpenArgs = {
  info: CapacityInfo;
  contextLabel?: string;
  snapshotId?: string | null;
};

type Ctx = {
  /** Opens the branded notice. Returns true when the error was a capacity wall. */
  reportCapacity: (err: any, opts?: { contextLabel?: string; snapshotId?: string | null }) => boolean;
};

const AiCapacityContext = createContext<Ctx | null>(null);

export function useAiCapacity(): Ctx {
  return (
    useContext(AiCapacityContext) ?? {
      reportCapacity: () => false,
    }
  );
}

export function AiCapacityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpenArgs | null>(null);
  const registered = useRef(false);

  const reportCapacity = useCallback<Ctx["reportCapacity"]>((err, opts) => {
    const info = parseCapacityError(err);
    if (!info) return false;
    setState({ info, contextLabel: opts?.contextLabel, snapshotId: opts?.snapshotId ?? null });
    return true;
  }, []);

  // Any `toastEdgeError` anywhere in the app routes capacity failures here
  // instead of showing a red technical toast.
  if (!registered.current) {
    registered.current = true;
    registerCapacityHandler((err) => reportCapacity(err));
  }

  const value = useMemo(() => ({ reportCapacity }), [reportCapacity]);

  return (
    <AiCapacityContext.Provider value={value}>
      {children}
      <AiCapacityDialog
        open={Boolean(state)}
        info={state?.info ?? null}
        contextLabel={state?.contextLabel}
        snapshotId={state?.snapshotId ?? null}
        onOpenChange={(open) => {
          if (!open) setState(null);
        }}
      />
    </AiCapacityContext.Provider>
  );
}
