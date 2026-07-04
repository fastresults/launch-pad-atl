import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function FacilitatorCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="border-l-4 border-primary bg-card rounded-xl p-10"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-card-foreground md:text-3xl">
        Want Adam launching your founders in your room?
      </h2>
      <p className="mt-3 text-base text-muted-foreground md:mt-4 md:text-lg mb-6">
        Half-day and full-day formats for teams, conferences, and private cohorts. This is the method
        modern founders are quietly using to launch in weeks instead of years — framework-driven,
        operator-led, AI-accelerated. Your room leaves with real revenue moves shipped that morning,
        not a slide deck and a vague to-do list.
      </p>
      <Button asChild size="lg" className="btn-glow">
        <a href="/contact">Bring Adam to your team &rarr;</a>
      </Button>
    </motion.section>
  );
}
