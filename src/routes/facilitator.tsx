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

export default function FacilitatorPage() {
  useDocumentTitle(
    "Adam Anderson — Facilitator behind The 14-Day Pivot Method",
    "Meet Adam Anderson: the operator who runs the workshops, webinars, and 1:1 builds behind Startuplabs' done-with-you method."
  );
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full px-6 py-16 md:py-24" style={{ maxWidth: "860px" }}>
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
