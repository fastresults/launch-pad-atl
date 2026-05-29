import { createFileRoute, useParams } from "@tanstack/react-router";
import { MediaHub } from "@/components/media/MediaHub";

export const Route = createFileRoute("/_authenticated/_admin/admin/attendees/$userId/media")({
  component: AttendeeMediaPage,
  head: () => ({ meta: [{ title: "Attendee Media" }] }),
});

function AttendeeMediaPage() {
  const { userId } = useParams({ from: "/_authenticated/_admin/admin/attendees/$userId/media" });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Attendee Media Hub</h1>
      <p className="text-sm text-muted-foreground">
        View and manage this attendee's media. Uploads here appear directly in their portal.
      </p>
      <MediaHub scope="user" ownerUserId={userId} />
    </div>
  );
}
