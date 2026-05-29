import { formatMinutesLeft, type WorkshopState } from "@/lib/workshop-mode";

export function RoomClock({ state }: { state: WorkshopState }) {
  if (state.mode !== "during" || !state.currentBlock) return null;
  const { currentBlock, minutesLeftInBlock = 0 } = state;
  const isStage = currentBlock.kind === "stage";
  const isBreak = currentBlock.kind === "break";
  const isClose = currentBlock.kind === "close";
  const amber = minutesLeftInBlock <= 5 && isStage;

  return (
    <div
      className={`sticky top-0 z-40 border-b backdrop-blur ${
        amber
          ? "border-amber-500/40 bg-amber-500/10"
          : isBreak
            ? "border-emerald-500/30 bg-emerald-500/10"
            : isClose
              ? "border-primary/40 bg-primary/10"
              : "border-white/10 bg-background/85"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 md:px-6 text-sm">
        <span className={`flex items-center gap-1.5 font-medium ${amber ? "text-amber-600 dark:text-amber-400" : isBreak ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-current"></span>
          </span>
          {isBreak ? "ON BREAK" : isClose ? "WE DID IT" : "NOW"}
        </span>
        <span className="font-medium truncate">{currentBlock.title}</span>
        <span className="text-muted-foreground hidden sm:inline">·</span>
        <span className="text-muted-foreground hidden sm:inline truncate">{currentBlock.subtitle}</span>
        <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {formatMinutesLeft(minutesLeftInBlock)}
        </span>
      </div>
    </div>
  );
}
