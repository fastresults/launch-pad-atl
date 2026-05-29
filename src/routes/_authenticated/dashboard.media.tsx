import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { MediaHub } from "@/components/media/MediaHub";

export const Route = createFileRoute("/_authenticated/dashboard/media")({
  component: MyMediaPage,
  head: () => ({ meta: [{ title: "My Media" }] }),
});

function MyMediaPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <MediaHub scope="user" ownerUserId={user.id} title="My Media Hub" />;
}
