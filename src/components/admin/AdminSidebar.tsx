import { getAdminBadges } from "@/lib/admin-badges.functions";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_GROUPS, ADMIN_NAV } from "@/lib/admin-nav";
import { LogOut, EyeOff } from "lucide-react";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import { StartupLabsMark } from "@/components/brand/StartupLabsMark";

export function AdminSidebar() {
  const { isSuperAdmin, signOut, user, isImpersonating, impersonationTarget, stopImpersonation } = useAuth();
  const { pathname } = useLocation();

  const { data: badges } = useQuery({
    queryKey: ["admin", "badges"],
    queryFn: getAdminBadges,
    staleTime: 30_000,
    refetchInterval: 60_000});

  const items = ADMIN_NAV.filter((n) => !n.super || isSuperAdmin);

  const isActive = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname === to || pathname.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/admin" className="flex items-center gap-2" aria-label="StartupLabs admin">
          <StartupLabsLogo className="h-7 w-auto text-foreground group-data-[collapsible=icon]:hidden" />
          <StartupLabsMark className="hidden h-6 w-6 group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {ADMIN_GROUPS.map((group) => {
          const groupItems = items.filter((i) => i.group === group);
          if (groupItems.length === 0) return null;
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const badge =
                      item.badgeKey && badges?.[item.badgeKey]
                        ? badges[item.badgeKey]
                        : 0;
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={!item.external && isActive(item.to)}
                          tooltip={item.label}
                        >
                          <Link
                            to={item.to}
                            target={item.external ? "_blank" : undefined}
                            className="flex items-center gap-2"
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {badge > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-5 min-w-5 justify-center px-1.5 text-[10px] group-data-[collapsible=icon]:hidden"
                              >
                                {badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {isImpersonating && impersonationTarget && (
          <button
            onClick={() => stopImpersonation()}
            className="mb-2 flex w-full items-center gap-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1.5 text-left text-[11px] text-amber-100 hover:bg-amber-500/20"
            title="Exit impersonation"
          >
            <EyeOff className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">
              As {impersonationTarget.name} — Exit
            </span>
          </button>
        )}
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-xs font-medium">{isImpersonating ? undefined : user?.email}</div>
            <div className="text-[10px] text-muted-foreground">
              {isSuperAdmin ? "Super admin" : "Admin"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
