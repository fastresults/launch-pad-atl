import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A single workshop deliverable rendered as a checked-off line item —
 * a receipt of what gets built with you in the room, not a button.
 */
export function DeliverableCheck({
  title,
  icon: Icon,
  className,
  ...rest
}: {
  title: string;
  icon: LucideIcon;
  className?: string;
} & React.LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      tabIndex={0}
      className={cn(
        "group flex cursor-help items-center gap-3.5 px-1 py-2.5",
        "transition-colors duration-200",
        "focus:outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-primary/20",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-inset ring-primary/40 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary group-focus-visible:bg-primary group-focus-visible:text-primary-foreground"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      <Icon
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground/50 transition-colors duration-200 group-hover:text-muted-foreground/80"
      />
      <span className="flex-1 text-base font-medium leading-snug tracking-tight">
        {title}
      </span>
    </li>
  );
}
