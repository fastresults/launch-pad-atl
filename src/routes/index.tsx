import { HomeFramework } from "@/components/home/HomeFramework";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function HomePage() {
  useDocumentTitle(
    "Startuplabs — Start your business in one morning",
    "Come spend one focused morning in Atlanta (or live on Zoom). We help everyday people start their business and get their first paying customer in two weeks — for $297."
  );

  return <HomeFramework />;
}
