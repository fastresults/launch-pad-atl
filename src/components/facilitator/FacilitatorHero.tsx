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
        40 years building brands for Fortune 500 companies and sovereign governments. Now translating that experience into practical AI skills that entrepreneurs and executives can use tomorrow morning.
      </p>
    </motion.section>
  );
}
