import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { BuildLayerItem } from "@/lib/framework-deliverables";

/**
 * One workshop in the build layer, rendered as an editorial image card:
 * photograph up top with the icon and price floating on it, copy below on a
 * fixed rhythm so every "Learn more" lines up across the grid.
 */
export function BuildLayerCard({
  item,
  href,
  priceLabel,
}: {
  item: BuildLayerItem;
  href: string;
  priceLabel: string;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card sl-card-with-image transition-colors duration-300 hover:border-primary/40"
    >
      {item.image ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          <img
            src={item.image}
            alt={item.imageAlt ?? ""}
            width={1024}
            height={640}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
          />
          {/* Dissolve the photo into the card so there's no hard seam. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-card/10"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <span className="inline-flex size-8 items-center justify-center rounded-full border border-white/15 bg-background/60 backdrop-blur-md">
              <Icon className="size-4 text-primary" />
            </span>
            <span className="rounded-full border border-primary/30 bg-background/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-primary backdrop-blur-md">
              Workshop · {priceLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-5 pb-0 md:p-6 md:pb-0">
          <Icon className="size-5 text-primary" />
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
            Workshop · {priceLabel}
          </span>
        </div>
      )}

      <div className="relative flex flex-1 flex-col p-5 pt-4 md:p-6 md:pt-4">
        <h3 className="text-base font-semibold leading-snug tracking-tight">{item.title}</h3>
        <p className="mt-1 font-serif text-sm italic leading-snug text-foreground/80">
          {item.subtitle}
        </p>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-medium text-primary">
          Learn more
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
