import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Calendar, ClipboardList, ListChecks, FolderOpen, User } from "lucide-react";
import { getMyCohort } from "@/lib/cohort.functions";
import { getWorkshopMode } from "@/lib/workshop-mode";
import { RoomClock } from "@/components/dashboard/RoomClock";
import { AIWorklogPill } from "@/components/dashboard/AIWorklogPill";
import { HelpFab } from "@/components/dashboard/HelpFab";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
  head: () => ({ meta: [{ title: "Your dashboard" }] }),
});

function DashboardLayout() {
  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen={true}>
        <DashboardShell />
      </SidebarProvider>
    </ThemeProvider>
  );
}

function DashboardShell() {
  const { user, signOut, isAdmin } = useAuth();
  const cohortFn = useServerFn(getMyCohort);
  const { data } = useQuery({
    queryKey: ["my", "cohort"],
    queryFn: () => cohortFn(),
    staleTime: 60_000,
  });
  const state = getWorkshopMode(new Date(), data?.cohort ?? null);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <AppSidebar mode={state.mode} />
      <div className="flex flex-1 flex-col min-w-0">
        <RoomClock state={state} />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-background/80 px-4 backdrop-blur md:px-6">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                Admin
              </Link>
            )}
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
        <AIWorklogPill />
        <HelpFab />
      </div>
    </div>
  );
}

type NavItem = { to: string; label: string; icon: typeof Home; dimmed?: boolean; hide?: boolean };

function AppSidebar({ mode }: { mode: ReturnType<typeof getWorkshopMode>["mode"] }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Mode-aware items: Workshop day disappears in Mode C, Plan is dimmed in Mode B.
  const items: NavItem[] = [
    { to: "/dashboard", label: "Today", icon: Home },
    { to: "/dashboard/day", label: "Workshop day", icon: Calendar, hide: mode === "after" },
    { to: "/dashboard/brief", label: "My startup", icon: ClipboardList },
    { to: "/dashboard/workflow", label: "Plan (25 steps)", icon: ListChecks, dimmed: mode === "during" },
    { to: "/dashboard/files", label: "My files", icon: FolderOpen },
    { to: "/dashboard/profile", label: "Account", icon: User },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <StartupLabsLogo className={collapsed ? "h-6 w-auto text-foreground" : "h-7 w-auto text-foreground"} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter((i) => !i.hide).map((item) => {
                const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link
                        to={item.to as never}
                        className={`flex items-center gap-3 ${item.dimmed ? "opacity-50" : ""}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-3 text-xs text-muted-foreground">
        {!collapsed && <span>v2 · Workshop mode</span>}
      </SidebarFooter>
    </Sidebar>
  );
}
