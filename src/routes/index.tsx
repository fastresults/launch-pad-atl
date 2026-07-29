import { HomeFramework } from "@/components/home/HomeFramework";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function HomePage() {
  useDocumentTitle(
    "Startuplabs — Your startup foundation, written with you",
    "Come spend one focused morning in Atlanta or live on Zoom. We write the four foundations your startup can build on: brand, offer, marketing, operations."
  );

  return <HomeFramework />;
}
