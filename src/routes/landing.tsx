import { StandaloneLanding } from "@/components/landing/StandaloneLanding";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function LandingRoute() {
  useDocumentTitle(
    "Startuplabs — Your startup, actually built in one morning",
    "Come spend one focused morning in Atlanta (or live on Zoom). We actually build your startup with you — live page, priced offer, first outreach sent — and land your first paying customer in two weeks. $297."
  );
  return <StandaloneLanding />;
}
