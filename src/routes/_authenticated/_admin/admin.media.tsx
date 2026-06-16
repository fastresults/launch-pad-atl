import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MediaHub } from "@/components/media/MediaHub";

export const Route =("/_authenticated/_admin/admin/media")({
  component: MasterMediaPage,
  head: () => ({ meta: [{ title: "Master Media Library" }] }),
});

export default function MasterMediaPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media library"
        description="Upload, reuse, and manage images used across the public site and founder dashboards."
      />
      <MediaHub scope="master" canAdminPush />
    </div>
  );
}
