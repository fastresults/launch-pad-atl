import { useQuery } from "@tanstack/react-query";
import { RegisterSelection } from "@/components/register/RegisterSelection";
import { RegisterOriginal } from "@/components/register/RegisterOriginal";
import { getPublicSiteSettings } from "@/lib/site-settings.functions";

export default function RegisterPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getPublicSiteSettings(),
    staleTime: 60_000,
  });
  if (isLoading) return null;
  if (data?.register_variant === "selection") return <RegisterSelection />;
  return <RegisterOriginal />;
}
