import { HomeFramework } from "@/components/home/HomeFramework";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function HomePage() {
  useDocumentTitle(
    "Startuplabs — The 14-Day Pivot Method by Adam Anderson",
    "Adam Anderson's done-with-you method for W-2 professionals ready to launch a real second income. Workshops, webinars, and 1:1 builds."
  );
  return <HomeFramework />;
}
