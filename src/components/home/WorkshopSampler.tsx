import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check } from "lucide-react";
import { nextDateLabel, type CatalogWorkshop } from "@/lib/workshop-catalog";

type Props = { workshop: CatalogWorkshop };

/**
 * The sampler pattern under the hero: one repeating section template that
 * re-renders with the selected workshop's substance — the pain, what actually
 * gets built that morning, the next date, and the price.
 */
export function WorkshopSampler({ workshop }: Props) {
  const Icon = workshop.icon;
  const date = nextDateLabel(workshop.slug);
  const isOpen = workshop.status === "open";

  return (
    <section id="learn-more" className="border-b border-border py-14 md:py-20">
      <div className="public-container px-6">
        <div
          key={workshop.slug}
          className="animate-in fade-in duration-500 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8"
        >
          <div className="md:col-span-7">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sl-quote-gold)]">
              <Icon className="size-4" aria-hidden="true" />
              {workshop.title}
            </div>
            <h2 className="public-heading mt-4">{workshop.painHeadline}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {workshop.painBody}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {date && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {isOpen ? `Next session · ${date}` : `Opens ${workshop.opensLabel}`}
                </span>
              )}
              <span>{workshop.priceLabel}</span>
            </div>
            <div className="mt-7">
              {isOpen ? (
                <Link
                  to={workshop.href}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Reserve your seat <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  to={workshop.href}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                >
                  See what this morning builds <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="border border-border bg-card p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sl-quote-gold)]">
                What actually gets built
              </p>
              <ul className="mt-4 space-y-3 text-sm text-foreground">
                {workshop.walkOuts.slice(0, 4).map((d) => (
                  <li key={d} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--sl-quote-gold)]" aria-hidden="true" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              {!isOpen && (
                <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                  Foundation comes first — everything here builds on what you leave with.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
