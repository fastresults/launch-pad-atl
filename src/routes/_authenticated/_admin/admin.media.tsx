import { createFileRoute } from "@tanstack/react-router";
import { MediaHub } from "@/components/media/MediaHub";

export const Route = createFileRoute("/_authenticated/_admin/admin/media")({
  component: MasterMediaPage,
  head: () => ({ meta: [{ title: "Master Media Library" }] }),
});

function MasterMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Master Media Library</h1>
        <p className="text-sm text-muted-foreground">
          Shared assets accessible only to super admins. Select files and push to specific attendees.
        </p>
      </div>
      <MediaHub scope="master" canAdminPush />
    </div>
  );
}
