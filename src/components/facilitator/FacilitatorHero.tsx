import { motion } from "framer-motion";
import adamPortrait from "@/assets/adam-anderson.jpg";

export function FacilitatorHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row md:items-start md:gap-10"
    >
      {/* Portrait — small on mobile (stacked above), 160px square on desktop (right of headline) */}
      <div className="order-1 md:order-2 md:flex-shrink-0 mb-6 md:mb-0 md:mt-[2.4rem]">
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm w-24 h-24 md:w-40 md:h-40">
          <img
            src={adamPortrait}
            alt="Adam Anderson, workshop facilitator"
            width={320}
            height={320}
            loading="eager"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="hidden md:block text-xs uppercase tracking-[0.18em] text-muted-foreground mt-3">
          Adam Anderson · Facilitator
        </p>
      </div>

      {/* Headline column — keeps the existing left primary border */}
      <div className="order-2 md:order-1 md:flex-1 border-l-4 border-primary pl-6">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
          The operator behind The 14-Day Pivot Method
        </p>
        <h1 className="public-display">
          Adam Anderson
          <br />
          <span className="text-gradient-brand">has been in your seat.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground md:mt-5 md:text-lg">
          Not a coach with a course. The operator behind The 14-Day Pivot Method — a founder who&rsquo;s started companies, shipped products, and now sits at your table to write the foundation with you. He knows what the first move looks like because he&rsquo;s made it, more than once.
        </p>
      </div>
    </motion.section>
  );
}
