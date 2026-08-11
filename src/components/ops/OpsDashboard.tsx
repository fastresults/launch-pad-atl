import { useEffect, useMemo, useState } from "react";
import { Check, Compass, Hammer, ListChecks, Map as MapIcon, Phone, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  currentRunwayDay, isOverdue, progressOf, FOUNDATION_DELIVERED,
  type DeliveryMode, type OpsNote, type OpsOwnerKind, type OpsStatus, type OpsTask, type OpsUpdate,
} from "@/lib/ops-runway";
import { activeStage, stageOf } from "@/lib/ops-guided";
import { GuidedStep } from "./GuidedStep";
import { OpsChecklist } from "./OpsChecklist";
import { OpsTimeline } from "./OpsTimeline";
import { OpsOnboarding } from "./OpsOnboarding";
import { DeliveryModeGate } from "./DeliveryModeGate";
import { DeliveryModeToggle } from "./DeliveryModeToggle";
import { PlatformAddOn } from "./PlatformAddOn";
import type { PlatformRequestInput } from "./PlatformRequestDialog";
import type { PlatformRequest } from "@/lib/ops-platform";

import { DeliveredRail } from "./DeliveredRail";
import type { DeliveryHandlers } from "./DeliveryPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InfoTip } from "./InfoTip";
import { OpsStageArt, OpsStageMasthead } from "./OpsStageArt";
import { OpsProgressRing } from "./OpsProgressRing";
import { TIPS } from "@/lib/ops-criticality";

type ViewMode = "guided" | "checklist" | "timeline";

export interface OpsDashboardProps extends DeliveryHandlers {
  tasks: OpsTask[];
  notes: OpsNote[];
  updates?: OpsUpdate[];
  startedAt?: string | null;
  canEdit: boolean;
  viewerKind: OpsOwnerKind;
  busyTaskId?: string | null;
  onStatus: (taskId: string, status: OpsStatus) => void;
  onOwner?: (taskId: string, owner: OpsOwnerKind) => void;
  onNote?: (taskId: string, body: string) => void;
  onProof?: (taskId: string, url: string) => void;
  onSnooze?: (taskId: string, days: number) => void;
  /** Jump the reading pane to a showcase asset, when one exists for this key. */
  onOpenAsset?: (assetKey: string) => void;
  assetTitle?: (assetKey: string) => string | null;
  onConsult?: () => void;
  /** False once the venture has seen the first-run walkthrough. */
  showIntro?: boolean;
  onDismissIntro?: () => void;
  /** Who is executing this runway — null means the decision hasn't been made. */
  deliveryMode?: DeliveryMode | null;
  onDeliveryMode?: (mode: DeliveryMode) => void;
  rateCents?: number | null;
  onRate?: (cents: number) => void;
  /** An existing platform-build request, when the founder has already raised one. */
  platformRequest?: PlatformRequest | null;
  onPlatformRequest?: (input: PlatformRequestInput) => Promise<void>;
  className?: string;
}

const VIEWS: [ViewMode, string, typeof Compass][] = [
  ["guided", "Guide me", Compass],
  ["checklist", "Full checklist", ListChecks],
  ["timeline", "The 90 days", MapIcon],
];

const MODE_LABEL: Record<DeliveryMode, string> = {
  self: "You're building this",
  retained: "Adam's team is building this",
};

/** What the foundation already delivered — credited before the remaining work. */
const FOUNDATION_DELIVERED = [
  "Offer and pricing",
  "Brand system",
  "Site direction and copy",
  "Campaign arc",
  "Operating assets",
];


/**
 * The operating runway both the founder (share link) and the agency (hub)
 * work out of. Guided mode is the default: a novice sees one step, not 130.
 */
export function OpsDashboard(props: OpsDashboardProps) {
  const { tasks, notes, startedAt, canEdit, viewerKind } = props;
  const [view, setView] = useState<ViewMode>(props.viewerKind === "agency" ? "checklist" : "guided");
  const [intro, setIntro] = useState(!!props.showIntro);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => { setIntro(!!props.showIntro); }, [props.showIntro]);

  const overall = progressOf(tasks);
  const day = currentRunwayDay(startedAt);
  const stagePhase = activeStage(tasks);
  const stage = stageOf(stagePhase);
  const stuck = tasks.filter((t) => t.status === "blocked").length;
  const late = tasks.filter((t) => isOverdue(t, startedAt) && t.status !== "done").length;
  const raw = props.deliveryMode ?? null;
  // Legacy hybrid rows read as self-build; the product only has two modes now.
  const mode: DeliveryMode | null = raw === "retained" ? "retained" : raw ? "self" : null;

  const shared = useMemo(() => ({
    tasks, notes, startedAt, canEdit, viewerKind,
    busyTaskId: props.busyTaskId,
    onStatus: props.onStatus, onOwner: props.onOwner, onNote: props.onNote,
    onProof: props.onProof, onSnooze: props.onSnooze,
    onOpenAsset: props.onOpenAsset, assetTitle: props.assetTitle,
    deliveryMode: mode,
    onAssign: props.onAssign, onCommittedDate: props.onCommittedDate,
    onDeliveryStatus: props.onDeliveryStatus, onWorkProduct: props.onWorkProduct,
    onReview: props.onReview, onHandoff: props.onHandoff,
  }), [tasks, notes, startedAt, canEdit, viewerKind, mode, props.busyTaskId, props.onStatus,
    props.onOwner, props.onNote, props.onProof, props.onSnooze, props.onOpenAsset, props.assetTitle,
    props.onAssign, props.onCommittedDate, props.onDeliveryStatus, props.onWorkProduct,
    props.onReview, props.onHandoff]);

  const dismissIntro = () => { setIntro(false); props.onDismissIntro?.(); };

  const chooseMode = (m: DeliveryMode) => { props.onDeliveryMode?.(m); setGateOpen(false); };

  if (intro) {
    return (
      <div className={cn("space-y-6", props.className)}>
        <OpsOnboarding onDone={dismissIntro} />
      </div>
    );
  }

  // The decision comes before the list: who is actually going to do this work.
  if ((!mode && props.onDeliveryMode) || gateOpen) {
    return (
      <div className={cn("space-y-6", props.className)}>
        <DeliveryModeGate
          tasks={tasks}
          currentMode={mode}
          rateCents={props.rateCents}
          onRate={props.onRate}
          onChoose={chooseMode}
          busy={!!props.busyTaskId}
          platformRequest={props.platformRequest}
          onPlatformRequest={props.onPlatformRequest}
        />
        {gateOpen && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => setGateOpen(false)}>Back to the runway</Button>
          </div>
        )}
      </div>
    );
  }


  return (
    <TooltipProvider delayDuration={120}>
    <div className={cn("space-y-6", props.className)}>
      <header className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-5">
        <OpsStageMasthead phase={stagePhase} className="w-[42%]" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Phase 2 of 2 · Foundation complete
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Operationalize</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Your foundation is built — the offer, brand system, site direction and copy, campaign arc
              and operating assets are done and yours. Nothing here recreates it. This phase puts it into
              the world: filing, accounts, systems, and the first sales.
              Right now you're in <span className="text-foreground">{stage.when} — {stage.name}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <InfoTip tip={TIPS.progress}>{overall.done} of {overall.total} done</InfoTip>{day ? ` · day ${day}` : ""}
              </div>
            </div>
            <OpsProgressRing pct={overall.pct} label="Complete" size={84} />
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-1.5">
          {FOUNDATION_DELIVERED.map((item) => (
            <span key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 text-primary" />{item}
            </span>
          ))}
          <span className="text-[11px] text-muted-foreground/80">Already done. This runway builds on it.</span>
        </div>




        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          {stuck > 0 && <span className="text-destructive">{stuck} stuck</span>}
          {late > 0 && <span className="text-destructive">{late} past due</span>}
          {!canEdit && <span>Read-only view</span>}
          {mode && canEdit && props.onDeliveryMode && (
            <DeliveryModeToggle
              mode={mode}
              tasks={tasks}
              disabled={!!props.busyTaskId}
              onChange={(m) => props.onDeliveryMode?.(m)}
            />
          )}
          {mode && (!canEdit || !props.onDeliveryMode) && (
            <span className="normal-case tracking-normal">{MODE_LABEL[mode]}</span>
          )}
          {mode && (
            <button
              type="button" onClick={() => setGateOpen(true)}
              className="inline-flex items-center gap-1.5 normal-case tracking-normal hover:text-foreground"
            >
              <Scale className="h-3 w-3" /> Compare the two
            </button>
          )}
          <button type="button" onClick={() => setIntro(true)} className="normal-case tracking-normal hover:text-foreground">
            How this works
          </button>
        </div>



        {(props.platformRequest || props.onPlatformRequest) && (
          <PlatformAddOn
            variant="strip"
            className="mt-4"
            mode={mode}
            request={props.platformRequest}
            onRequest={canEdit ? props.onPlatformRequest : undefined}
          />
        )}

        <div className="mt-4 inline-flex flex-wrap gap-1 rounded-full border border-border/50 bg-background/50 p-1">
          {VIEWS.map(([v, label, Icon]) => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            ><Icon className="h-3.5 w-3.5" />{label}</button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          {view === "guided" && (
            <GuidedStep {...shared} onConsult={props.onConsult} onSeeAll={() => setView("checklist")} />
          )}
          {view === "checklist" && <OpsChecklist {...shared} />}
          {view === "timeline" && <OpsTimeline tasks={tasks} onJump={() => setView("checklist")} />}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Where you are</h4>
            <OpsStageArt phase={stagePhase} className="mt-3 h-16 opacity-70" />
            <p className="mt-2 text-sm font-medium">{stage.when} — {stage.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stage.promise}</p>
            {view !== "guided" && (
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setView("guided")}>
                <Compass className="mr-1.5 h-3.5 w-3.5" /> Just tell me what's next
              </Button>
            )}
          </div>

          {mode !== "self" && (
            <DeliveredRail tasks={tasks} updates={props.updates} />
          )}


          {props.onConsult && (
            <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Want it done with you?</h4>
              <p className="mt-2 text-xs text-muted-foreground">
                Adam's team can run this list alongside you instead of handing it over.
              </p>
              <Button size="sm" className="mt-3 w-full" onClick={props.onConsult}>
                <Hammer className="mr-1.5 h-3.5 w-3.5" /> Request a consultation
              </Button>
              <a href="tel:19292347355"
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
                <Phone className="h-3 w-3" /> 929-234-7355
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
    </TooltipProvider>
  );
}

export default OpsDashboard;
