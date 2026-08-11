import { InvestmentCompare } from "./InvestmentCompare";
import type { DeliveryMode, OpsTask } from "@/lib/ops-runway";
import type { PlatformRequest } from "@/lib/ops-platform";
import type { PlatformRequestInput } from "./PlatformRequestDialog";

/**
 * Shown before any step list when a venture hasn't decided how the runway gets
 * delivered. The choice reshapes ownership across the whole catalog.
 */
export function DeliveryModeGate({
  tasks, onChoose, busy, currentMode, rateCents, onRate, platformRequest, onPlatformRequest,
}: {
  tasks: OpsTask[];
  onChoose: (mode: DeliveryMode) => void;
  busy?: boolean;
  currentMode?: DeliveryMode | null;
  rateCents?: number | null;
  onRate?: (cents: number) => void;
  platformRequest?: PlatformRequest | null;
  onPlatformRequest?: (input: PlatformRequestInput) => Promise<void>;
}) {
  return (
    <InvestmentCompare
      tasks={tasks}
      onChoose={onChoose}
      busy={busy}
      currentMode={currentMode}
      rateCents={rateCents}
      onRate={onRate}
      platformRequest={platformRequest}
      onPlatformRequest={onPlatformRequest}
    />
  );
}

export default DeliveryModeGate;
