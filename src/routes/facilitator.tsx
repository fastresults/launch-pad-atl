import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { FacilitatorHero } from "@/components/facilitator/FacilitatorHero";
import { FacilitatorStats } from "@/components/facilitator/FacilitatorStats";
import { FacilitatorStory } from "@/components/facilitator/FacilitatorStory";
import { FacilitatorPillars } from "@/components/facilitator/FacilitatorPillars";
import { FacilitatorTimeline } from "@/components/facilitator/FacilitatorTimeline";
import { FacilitatorAudience } from "@/components/facilitator/FacilitatorAudience";
import { FacilitatorCTA } from "@/components/facilitator/FacilitatorCTA";
import { useDocumentTitle } from "@/lib/use-document-title";

const FACILITATOR_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Adam Anderson",
  jobTitle: "Founder & Facilitator, Startuplabs",
  worksFor: {
    "@type": "Organization",
    name: "Startuplabs",
    url: "https://startuplabs.online",
  },
  url: "https://startuplabs.online/facilitator",
  description:
    "Operator behind The 14-Day Pivot Method — a done-with-you method for W-2 professionals launching a real second income.",
};

export default function FacilitatorPage() {
  useDocumentTitle(
    "Adam Anderson — Facilitator behind The 14-Day Pivot Method",
    "Meet Adam Anderson: the operator who runs the workshops, webinars, and 1:1 builds behind Startuplabs' done-with-you method.",
    FACILITATOR_JSON_LD,
  );
  return (
    <div className="public-surface min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[53.75rem] flex-1 px-6 py-16 md:py-24">
        <div className="space-y-12 md:space-y-20">
          <FacilitatorHero />
          <div className="border-t border-border" />
          <FacilitatorStats />
          <div className="border-t border-border" />
          <FacilitatorStory />
          <div className="border-t border-border" />
          <FacilitatorPillars />
          <div className="border-t border-border" />
          <FacilitatorTimeline />
          <div className="border-t border-border" />
          <FacilitatorAudience />
          <div className="border-t border-border" />
          <FacilitatorCTA />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
