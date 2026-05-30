import { motion } from "framer-motion";

export function FacilitatorHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-l-4 border-primary pl-6"
    >
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
    </motion.section>
  );
}
