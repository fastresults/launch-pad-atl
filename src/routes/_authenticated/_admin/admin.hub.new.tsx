// @ts-nocheck
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import HubNewPage from "@/routes/_authenticated/dashboard/hub.new";

/**
 * Super-admin venture creation. Uses the same intake flow founders get, but the
 * venture is created under the signed-in admin account — so it only shows up in
 * the admin's own workspace and in the Founders Hub admin list.
 */
export default function AdminHubNewPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New venture"
        description="Create an internal venture under your own admin account. Only you and other admins will see it — attendees never do."
      />
      <Link
        to="/admin/hub"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Founders Hub
      </Link>
      <HubNewPage />
    </div>
  );
}
