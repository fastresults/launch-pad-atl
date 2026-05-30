import { Link, useRouterState } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ADMIN_NAV } from "@/lib/admin-nav";

export function AdminBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // find best matching nav item
  const match = ADMIN_NAV.filter((n) => !n.external)
    .filter((n) => pathname === n.to || pathname.startsWith(n.to + "/"))
    .sort((a, b) => b.to.length - a.to.length)[0];

  const label = match?.label ?? "Admin";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/admin">Admin</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {match && match.to !== "/admin" && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
        {(!match || match.to === "/admin") && (
          <BreadcrumbItem className="md:hidden">
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
