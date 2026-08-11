import { InvestmentCompare } from "./InvestmentCompare";
import type { DeliveryMode, OpsTask } from "@/lib/ops-runway";

/**
 * Shown before any step list when a venture hasn't decided how the runway gets
 * delivered. The choice reshapes ownership across the whole catalog.
 */
export function DeliveryModeGate({
  tasks, onChoose, busy, currentMode, rateCents, onRate,
}: {
  tasks: OpsTask[];
  onChoose: (mode: DeliveryMode) => void;
  busy?: boolean;
  currentMode?: DeliveryMode | null;
  rateCents?: number | null;
  onRate?: (cents: number) => void;
}) {
  return (
    <InvestmentCompare
      tasks={tasks}
      onChoose={onChoose}
      busy={busy}
      currentMode={currentMode}
      rateCents={rateCents}
      onRate={onRate}
    />
  );
}

export default DeliveryModeGate;
