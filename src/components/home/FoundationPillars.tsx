import fpBrand from "@/assets/foundations/brand.jpg.asset.json";
import fpProduct from "@/assets/foundations/product.jpg.asset.json";
import fpMarketing from "@/assets/foundations/marketing.jpg.asset.json";
import fpOperations from "@/assets/foundations/operations.jpg.asset.json";

type Pillar = {
  num: string;
  title: string;
  body: string;
  image: string;
  alt: string;
};

const PILLARS: Pillar[] = [
  {
    num: "01",
    title: "Brand",
    body:
      "Your name, your positioning, and the way you sound. Locked in the room, in the words you'll use everywhere.",
    image: fpBrand.url,
    alt: "A hand writing on cream paper beside a navy brand swatch card",
  },
  {
    num: "02",
    title: "Product",
    body:
      "One offer, priced, with the reason someone pays that number written in plain English.",
    image: fpProduct.url,
    alt: "A folded card and a price tag lit on a dark stone table",
  },
  {
    num: "03",
    title: "Marketing",
    body:
      "The real copy and structure for your page, plus fifty named prospects and the exact message to send each one.",
    image: fpMarketing.url,
    alt: "A printed contact sheet, a coffee cup and a phone on a dark desk",
  },
  {
    num: "04",
    title: "Operations",
    body:
      "How money comes in, what happens after the yes, and the working assets a banker or first hire reads in 60 seconds.",
    image: fpOperations.url,
    alt: "A stack of folders, a fountain pen and a brass paperweight under a desk lamp",
  },
];

/**
 * The four foundations written in the room, as editorial image cards — photo
 * up top with the numeral riding on it, copy below on a shared rhythm.
 */
export function FoundationPillars() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PILLARS.map((p) => (
        <article
          key={p.num}
          className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card sl-card-with-image"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <img
              src={p.image}
              alt={p.alt}
              width={1024}
              height={640}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
            />
            <div
              aria-hidden="true"
              className="sl-photo-scrim absolute inset-0"
            />
            <span className="absolute left-4 top-3 font-serif text-4xl leading-none text-primary drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              {p.num}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-5 pt-4">
            <h3 className="text-base font-semibold tracking-tight">{p.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
