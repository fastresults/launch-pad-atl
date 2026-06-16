import { useAuth } from "@/hooks/use-auth";
import { MediaHub } from "@/components/media/MediaHub";

export const Route =("/_authenticated/dashboard/media")({
  component: MyMediaPage,
  head: () => ({ meta: [{ title: "My Media" }] }),
});

export default function MyMediaPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <MediaHub scope="user" ownerUserId={user.id} title="My Media Hub" />;
}
