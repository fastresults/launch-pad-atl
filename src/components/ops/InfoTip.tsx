import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * A tiny "why is this here?" affordance. Wrap a label, or use standalone.
 * Nothing in the Operationalize UI should be unexplained.
 */
export function InfoTip({
  tip,
  children,
  className,
  side = "top",
}: {
  tip: string;
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex cursor-help items-center gap-1 rounded outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
        >
          {children}
          <Info className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          <span className="sr-only">More information</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}
