import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  primary: { to?: string; href?: string; label: string; onClick?: () => void };
  secondary?: { to?: string; label: string };
};

export function NextActionCard({ eyebrow, title, description, primary, secondary }: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card p-8 md:p-10 shadow-sm">
      {eyebrow && <div className="text-xs font-medium uppercase tracking-wide text-primary">{eyebrow}</div>}
      <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight leading-tight">{title}</h2>
      {description && <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">{description}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {primary.to ? (
          <Link
            to={primary.to as never}
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 min-h-[44px]"
          >
            {primary.label}
          </Link>
        ) : primary.href ? (
          <a
            href={primary.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 min-h-[44px]"
          >
            {primary.label}
          </a>
        ) : (
          <button
            onClick={primary.onClick}
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 min-h-[44px]"
          >
            {primary.label}
          </button>
        )}
        {secondary && (
          <Link to={secondary.to as never} className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
