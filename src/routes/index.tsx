import { HomeFramework } from "@/components/home/HomeFramework";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function HomePage() {
  useDocumentTitle(
    "Startuplabs — Your startup, actually built in one morning",
    "Come spend one focused morning in Atlanta (or live on Zoom). We write the four foundations your startup runs on — brand, priced offer, page copy, operations — so you're set up for your first paying customer in two weeks. $297."
  );

  return <HomeFramework />;
}
