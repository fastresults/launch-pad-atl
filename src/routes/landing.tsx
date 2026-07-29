import { StandaloneLanding } from "@/components/landing/StandaloneLanding";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function LandingRoute() {
  useDocumentTitle(
    "Startuplabs Atlanta — Your startup, built with you in one morning",
    "An in-person Atlanta workshop at the IGNITE Center in Norcross, GA. One focused morning — brand, priced offer, page copy, operations, all written with you. 3 free seats, August 20."
  );

  return <StandaloneLanding />;
}
