import { motion } from "framer-motion";

export function FacilitatorStory() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <p className="font-body text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-4">
        The Story
      </p>
      <h2 className="font-display font-bold text-[28px] text-foreground mb-6">A practitioner's path</h2>
      <div className="space-y-6 font-body text-base leading-[1.8] text-foreground/90">
        <p>
          Adam Anderson has spent four decades at the intersection of brand, communications, and business transformation. His career began in the boardrooms of Fortune 500 companies, and evolved into a global practice that eventually brought him to the Caribbean — where he served as a strategic technology partner to the federal government of St. Kitts & Nevis, building eGovernment infrastructure, an IRS portal, and sovereign branding programs from the ground up.
        </p>
        <p>
          In 2009, he founded OPEN Interactive, a full-service digital agency and event production company headquartered in the West Indies. OPEN Interactive serves three continents. He is the originating architect of the Caribbean Investment Summit, a premier convergence event for global wealth migration and citizenship-by-investment that he has grown into a multi-government, multi-sponsor regional institution.
        </p>
        <blockquote className="border-l-[3px] border-primary pl-5 italic font-display font-bold text-[22px] leading-snug text-foreground">
          I didn't learn AI in a classroom. I built five products with it — while running a live agency, producing international events, and advising clients who couldn't afford to get it wrong.
        </blockquote>
        <p>
          Today, Adam is Founder & CEO of Ampfli, an AI-powered content intelligence platform, and is building the Institute of AI Professionals (IAIP) — a global standards body for AI practitioners. He actively ships SaaS products on the bleeding edge — composing frontier LLMs, agentic frameworks, AI-native code generation, vector databases, and serverless edge infrastructure — and brings that live toolchain directly into every workshop so audiences sharpen the same skills he uses in production each day.
        </p>
      </div>
    </motion.section>
  );
}
