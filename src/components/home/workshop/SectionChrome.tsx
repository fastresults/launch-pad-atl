import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The shared chrome for a workshop sales section. Both the homepage stack and
 * the full /build/:slug page compose from these so the two surfaces can't
 * drift apart again.
 */
export function SectionShell({
  tinted,
  className,
  children,
}: {
  tinted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "border-t border-white/5 py-14 md:py-20",
        tinted && "bg-white/[0.02]",
        className,
      )}
    >
      <div className="public-container px-6">{children}</div>
    </section>
  );
}

/** Blue, uppercase, wide-tracked, with the section's own icon. */
export function SectionEyebrow({
  icon: Icon,
  muted,
  children,
}: {
  icon?: LucideIcon;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] md:text-sm",
        muted ? "text-muted-foreground" : "text-primary",
      )}
    >
      {Icon && <Icon className={cn("size-4", muted && "text-primary")} aria-hidden="true" />}
      {children}
    </p>
  );
}

/** Headline at the public display scale, closing phrase in the brand gradient. */
export function SectionHeading({
  lead,
  emphasis,
  className,
}: {
  lead: ReactNode;
  emphasis?: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("public-heading mt-4 max-w-3xl", className)}>
      {lead}
      {emphasis ? (
        <>
          {" "}
          <span className="text-gradient-brand">{emphasis}</span>
        </>
      ) : null}
    </h2>
  );
}

/** Rounded card on the card surface — the workshop page's content block. */
export function Panel({
  accent,
  className,
  children,
}: {
  accent?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-6",
        accent ? "border-primary/30" : "border-white/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The gradient reserve button used as the primary CTA on both surfaces. */
export function PrimaryCta({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-hero-gradient px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90",
        className,
      )}
    >
      {children}
    </a>
  );
}
