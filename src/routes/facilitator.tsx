import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { FacilitatorHero } from "@/components/facilitator/FacilitatorHero";
import { FacilitatorStats } from "@/components/facilitator/FacilitatorStats";
import { FacilitatorStory } from "@/components/facilitator/FacilitatorStory";
import { FacilitatorPillars } from "@/components/facilitator/FacilitatorPillars";
import { FacilitatorTimeline } from "@/components/facilitator/FacilitatorTimeline";
import { FacilitatorAudience } from "@/components/facilitator/FacilitatorAudience";
import { FacilitatorCTA } from "@/components/facilitator/FacilitatorCTA";

export const Route = createFileRoute("/facilitator")({
  head: () => ({
    meta: [
      { title: "About Adam Anderson | AI Workshop Facilitator | StartupLabs" },
      {
        name: "description",
        content:
          "40 years of brand, tech, and business transformation experience. Adam Anderson teaches entrepreneurs and executives practical AI skills, startup building, and personal brand strategy.",
      },
      { property: "og:title", content: "About Adam Anderson | AI Workshop Facilitator | StartupLabs" },
      {
        property: "og:description",
        content:
          "40 years of brand, tech, and business transformation experience. Adam Anderson teaches entrepreneurs and executives practical AI skills, startup building, and personal brand strategy.",
      },
      { property: "og:url", content: "https://startuplabs.online/facilitator" },
    ],
    links: [{ rel: "canonical", href: "https://startuplabs.online/facilitator" }],
  }),
  component: FacilitatorPage,
});

function FacilitatorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main
        className="flex-1 mx-auto w-full px-6 py-16 md:py-24"
        style={{ maxWidth: "860px" }}
      >

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
