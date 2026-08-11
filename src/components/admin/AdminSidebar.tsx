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
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ADMIN_GROUPS,
  ADMIN_GROUP_META,
  ADMIN_NAV,
  isNavItemActive,
  type AdminNavItem,
} from "@/lib/admin-nav";
import { LogOut, EyeOff, ChevronRight } from "lucide-react";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import { StartupLabsMark } from "@/components/brand/StartupLabsMark";

export function AdminSidebar() {
  const {
    isSuperAdmin,
    signOut,
    actorUser,
    isImpersonating,
    impersonationTarget,
    stopImpersonation,
  } = useAuth();
  const { pathname } = useLocation();

  const { data: badges } = useQuery({
    queryKey: ["admin", "badges"],
    queryFn: getAdminBadges,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const allowed = (n: AdminNavItem) => !n.super || isSuperAdmin;
  const items = ADMIN_NAV.filter(allowed).map((item) => ({
    ...item,
    children: item.children?.filter(allowed),
  }));

  const badgeFor = (item: AdminNavItem) =>
    item.badgeKey && badges?.[item.badgeKey] ? badges[item.badgeKey] : 0;

  const renderLeaf = (item: AdminNavItem) => {
    const Icon = item.icon;
    const count = badgeFor(item);
    return (
      <SidebarMenuItem key={item.to}>
        <SidebarMenuButton
          asChild
          isActive={!item.external && isNavItemActive(pathname, item.to)}
          tooltip={item.description ? `${item.label} — ${item.description}` : item.label}
        >
          <Link
            to={item.to}
            target={item.external ? "_blank" : undefined}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {count > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-5 justify-center px-1.5 text-[10px] group-data-[collapsible=icon]:hidden"
              >
                {count}
              </Badge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderBranch = (item: AdminNavItem) => {
    const Icon = item.icon;
    const children = item.children ?? [];
    const childActive = children.some((c) => isNavItemActive(pathname, c.to));
    return (
      <Collapsible key={item.to} defaultOpen={childActive} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton isActive={childActive} tooltip={item.label}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {children.map((child) => (
                <SidebarMenuSubItem key={child.to}>
                  <SidebarMenuSubButton asChild isActive={isNavItemActive(pathname, child.to)}>
                    <Link to={child.to} className="flex items-center gap-2">
                      <child.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

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
          const meta = ADMIN_GROUP_META[group];
          const groupCount = groupItems.reduce((sum, i) => sum + badgeFor(i), 0);
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel title={meta.hint} className="flex items-center gap-2">
                <span className="truncate">{meta.label}</span>
                {groupCount > 0 && (
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-primary group-data-[collapsible=icon]:inline-block" />
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map((item) =>
                    item.children && item.children.length > 0
                      ? renderBranch(item)
                      : renderLeaf(item),
                  )}
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
            className="mb-2 flex w-full items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-left text-[11px] text-foreground hover:bg-primary/20"
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
            <div className="truncate text-xs font-medium">{actorUser?.email}</div>
            <div className="text-[10px] text-muted-foreground">
              {isSuperAdmin ? "Super admin" : "Admin"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
