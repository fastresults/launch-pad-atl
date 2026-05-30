import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MediaHub } from "@/components/media/MediaHub";

export const Route = createFileRoute("/_authenticated/_admin/admin/media")({
  component: MasterMediaPage,
  head: () => ({ meta: [{ title: "Master Media Library" }] }),
});

function MasterMediaPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media library"
        description="Upload and manage images used across the public site and founder dashboard. Reuse assets without re-uploading, copy hosted URLs into editors, and delete files that are no longer referenced. Keeping this library tidy ensures the marketing site stays fast and that founders always see current branding instead of stale or duplicate imagery."
      />
      <MediaHub scope="master" canAdminPush />
    </div>
  );
}
