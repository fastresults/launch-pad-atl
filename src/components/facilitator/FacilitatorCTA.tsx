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
      <h2 className="text-2xl font-semibold tracking-tight text-card-foreground mb-3 md:text-3xl">
        Ready to build in the AI era?
      </h2>
      <p className="text-base leading-[1.8] text-muted-foreground mb-6">
        Half-day and full-day formats available for teams, conferences, and private cohorts. Every engagement is custom-scoped, practitioner-led, and built to leave the room with work already shipped.
      </p>
      <Button asChild size="lg">
        <a href="mailto:adam@madebyopen.com">Book a Workshop →</a>
      </Button>
    </motion.section>
  );
}
