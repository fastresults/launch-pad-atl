import { HomeFramework } from "@/components/home/HomeFramework";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function HomePage() {
  useDocumentTitle(
    "Startuplabs — Start your side hustle in one morning",
    "Come spend one Saturday morning in Atlanta (or live on Zoom). We help everyday people start their thing and get their first paying customer in two weeks — for $197."
  );

  return <HomeFramework />;
}
