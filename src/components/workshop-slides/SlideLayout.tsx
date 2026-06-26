import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** "01 · FOUNDATION" — top-left kicker */
  stageKicker?: string;
  /** "3 / 10" — bottom-right counter */
  pageLabel?: string;
  /** background variant */
  variant?: "light" | "dark";
  /** removes side padding for full-bleed slides */
  bleed?: boolean;
};

export function SlideLayout({ children, stageKicker, pageLabel, variant = "light", bleed = false }: Props) {
  const bg =
    variant === "dark"
      ? "bg-[hsl(222,47%,11%)] text-white"
      : "bg-background text-foreground";
  const kickerColor = variant === "dark" ? "text-white/70" : "text-muted-foreground";
  return (
    <div className={`w-full h-full flex flex-col ${bg}`}>
      {/* Top chrome */}
      <div className="flex items-center justify-between px-20 pt-14">
        <div className={`slide-kicker font-semibold ${kickerColor}`}>{stageKicker ?? ""}</div>
        <div className={`slide-kicker font-medium ${kickerColor}`}>StartupLabs · Workshop</div>
      </div>
      {/* Body */}
      <div className={`flex-1 flex ${bleed ? "" : "px-20"} pt-8 pb-8`}>
        <div className="flex-1 flex flex-col justify-center">{children}</div>
      </div>
      {/* Bottom chrome */}
      <div className="flex items-center justify-between px-20 pb-12">
        <div className={`slide-page ${kickerColor}`}>startuplabs.online</div>
        <div className={`slide-page font-medium ${kickerColor}`}>{pageLabel ?? ""}</div>
      </div>
    </div>
  );
}
