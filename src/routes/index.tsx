import { useQuery } from "@tanstack/react-query";
import { HomeSelection } from "@/components/home/HomeSelection";
import { HomeOriginal } from "@/components/home/HomeOriginal";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getPublicSiteSettings(),
    staleTime: 60_000,
  });
  if (isLoading) return null;
  if (data?.home_variant === "selection") return <HomeSelection />;
  return <HomeOriginal />;
}
