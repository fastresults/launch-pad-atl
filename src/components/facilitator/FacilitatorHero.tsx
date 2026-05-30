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
      <div className="order-1 md:order-2 md:flex-shrink-0 mb-6 md:mb-0">
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
        <p className="hidden md:block font-body text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mt-3">
          Adam Anderson · Facilitator
        </p>
      </div>

      {/* Headline column — keeps the existing left primary border */}
      <div className="order-2 md:order-1 md:flex-1 border-l-4 border-primary pl-6">
        <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-4">
          Workshop Facilitator & AI Strategist
        </p>
        <h1 className="font-display font-black leading-[1.1] text-foreground text-[36px] md:text-[52px]">
          Adam Anderson
          <br />
          doesn't teach theory.
          <br />
          He teaches what works.
        </h1>
        <p className="font-body text-base leading-[1.8] text-muted-foreground mt-6">
          One of the few practitioners fluent across three rooms most consultants never enter together — Fortune 500 boardrooms, sovereign cabinet ministries, and the AI-native product trenches. Workshops translate that fluency into skills you can deploy Monday morning.
        </p>
      </div>
    </motion.section>
  );
}
