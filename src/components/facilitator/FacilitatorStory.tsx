import { motion } from "framer-motion";

export function FacilitatorStory() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground md:text-sm md:tracking-[0.2em]">
        The Story
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">A practitioner's path</h2>
      <div className="mt-4 space-y-6 text-base text-foreground/90 md:mt-5 md:text-lg">
        <p>
          <span className="font-semibold text-foreground">Boardrooms.</span> Adam's first chapter was built inside the world's most demanding brands. From Orlando, he contributed to the creative and production teams behind the Mayo Clinic Experience Center at Mall of America, the 3M HIS Division Experience Center, and the Amway Arena visitor experience — helping translate clinical-grade, enterprise-grade messaging into environments people actually wanted to walk through. Citigroup, Disney, and a roster of Fortune 500 clients followed.
        </p>
        <p>
          <span className="font-semibold text-foreground">Nations.</span> In 2014 he relocated to the Federation of St. Kitts & Nevis to co-found the Caribbean entity of OPEN Interactive and lead what became the region's largest public-private technology partnership. Over seven years he engineered the Federation's central eGovernment portal, the Inland Revenue tax portal, and a child-protective-services case-management system; branded the national Citizenship-by-Investment program; advised the St. Kitts–Nevis pavilion at Expo 2020 Dubai; and directed pro-bono COVID-19 crisis communications for the Ministry of Health. In parallel, he co-originated the Caribbean Investment Summit — now a five-jurisdiction franchise spanning Grenada, Antigua & Barbuda, and Saint Lucia.
        </p>
        <blockquote className="border-l-[3px] border-primary pl-5 italic text-xl tracking-tight leading-tight md:text-3xl text-foreground">
          I didn't learn AI in a classroom. I built five products with it — while running a live agency, producing international events, and advising clients who couldn't afford to get it wrong.
        </blockquote>
        <p>
          <span className="font-semibold text-foreground">Frontier.</span> In 2025, Adam is developing Ampfli (<a href="https://askeve.io" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">askeve.io</a>), an AI-powered content intelligence platform, and the Institute of AI Professionals (<a href="https://theiaip.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">theiaip.com</a>) — a global standards body for AI practitioners with founding chapters across five world regions. Both platforms are scheduled for release in 2026. He builds on the bleeding edge — composing frontier LLMs, agentic frameworks, AI-native code generation, vector databases, and serverless edge infrastructure — and walks workshop audiences through the same live toolchain he uses in production each day.
        </p>
      </div>
    </motion.section>
  );
}
