import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Home, Calendar, ClipboardList, ListChecks, FolderOpen, User, Sparkles, Info, Brain, Plus, Hammer } from "lucide-react";
import { listCohorts } from "@/lib/cohorts.functions";
import { getWorkshopMode } from "@/lib/workshop-mode";
import { getNextAvailable, FALLBACK_COHORT, type Cohort } from "@/lib/cohorts";
import { RoomClock } from "@/components/dashboard/RoomClock";
import { AIWorklogPill } from "@/components/dashboard/AIWorklogPill";
import { HelpFab } from "@/components/dashboard/HelpFab";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import { getPublicSiteSettings, DEFAULT_DASHBOARD_NAV_VISIBILITY, type DashboardNavKey } from "@/lib/site-settings.functions";

export default function DashboardLayout() {
  return (
    <ThemeProvider forced="light">
      <SidebarProvider defaultOpen={true}>
        <DashboardShell />
      </SidebarProvider>
    </ThemeProvider>
  );
}

function DashboardShell() {
  const { user, signOut, isAdmin } = useAuth();
  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ["cohorts"],
    queryFn: listCohorts,
    staleTime: 60_000,
  });
  const cohort = getNextAvailable(cohorts) ?? FALLBACK_COHORT;
  const state = getWorkshopMode(new Date(), cohort);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <AppSidebar mode={state.mode} />

      <div className="flex flex-1 flex-col min-w-0">
        <RoomClock state={state} />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin</Link>
            )}
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
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

type NavItem = { key: DashboardNavKey; to: string; label: string; tooltip: string; icon: typeof Home; dimmed?: boolean; hide?: boolean };

function AppSidebar({ mode }: { mode: ReturnType<typeof getWorkshopMode>["mode"] }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { foundersHubAccess, isAdmin } = useAuth();
  const hubVisible = foundersHubAccess || isAdmin;

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings", "nav"],
    queryFn: getPublicSiteSettings,
    staleTime: 60_000,
  });
  const visibility = siteSettings?.dashboard_nav_visibility ?? DEFAULT_DASHBOARD_NAV_VISIBILITY;

  const items: NavItem[] = [
    {
      key: "today",
      to: "/dashboard",
      label: "Today",
      tooltip: "Your daily check-in. Before your 14-Day Sprint you'll see a countdown and venue; during the sprint, the live day in play; after, your 90-day progress and the next action waiting on you.",
      icon: Home,
    },
    {
      key: "brain" as any,
      to: "/dashboard/brain",
      label: "Second Brain",
      tooltip: "Your voice-and-text command center. Ask anything about your startup, save notes, and rebuild memory as new startup assets are generated. Everything is grounded in your own brief, assets, and assessments.",
      icon: Brain,
    },
    {
      key: "workshop",
      to: "/dashboard/day",
      label: "Workshop day",
      tooltip: "Your reservation in one place: the date, the venue with directions, the block-by-block morning agenda, the four things to bring, and the two entry paths to choose between when you arrive.",
      icon: Calendar,
      hide: mode === "after",
    },
    {
      key: "brief",
      to: "/dashboard/brief",
      label: "Startup brief",
      tooltip: "Answer ten questions by typing or by voice. The brief becomes the source every startup asset reads from — when it's complete and confirmed, your facilitator's AI can build the rest of your kit.",
      icon: ClipboardList,
    },
    {
      key: "deliverables",
      to: "/dashboard/workflow",
      label: "Deliverables",
      tooltip: "Generate your 60+ founder-ready startup assets across six tracks. Build one at a time or run the remaining batch. Each card shows what's locked, what's queued, what's ready to read.",
      icon: ListChecks,
      dimmed: mode === "during",
    },
    {
      key: "hub",
      to: "/dashboard/hub",
      label: "Ventures",
      tooltip: "Every startup concept you've explored, with its own 60+ asset workspace. Use “New venture” below to add one — drop in a URL or describe an idea — then star favorites, archive what's noise, and reopen anything to keep refining.",
      icon: Sparkles,
      hide: !hubVisible,
    },
    {
      key: "hub",
      to: "/dashboard/hub/new",
      label: "New venture",
      tooltip: "Start a brand-new venture workspace. Paste a website URL or describe the idea in a sentence, and we'll spin up its own asset library.",
      icon: Plus,
      hide: !hubVisible,
    },
    {
      key: "operations",
      to: "/dashboard/operations",
      label: "Operationalize",
      tooltip: "The 90-day operating runway you and your team work from — legal, money, CRM, demand, rhythm — plus creative sign-off on every asset before it goes out.",
      icon: Hammer,
      hide: !hubVisible,
    },

    {
      key: "files",
      to: "/dashboard/files",
      label: "My files",
      tooltip: "One shelf for everything yours: the assets your AI built for you, the PDFs and contracts you've uploaded, and the brand photos and logos you and your designer keep adding.",
      icon: FolderOpen,
    },
    {
      key: "profile",
      to: "/dashboard/profile",
      label: "Founder profile",
      tooltip: "Tell us about you, your startup, and your numbers — revenue, burn, runway. Every field you fill makes every startup asset sharper. Save each section as you go; finish when it feels right.",
      icon: User,
    },
  ];

  // Admins always see all items (with a "Hidden" badge); regular users only see enabled items.
  const visibleItems = items.filter((i) => {
    if (i.hide) return false;
    if (isAdmin) return true;
    return visibility[i.key] !== false;
  });

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
              {visibleItems.map((item) => {
                const active =
                  item.to === "/dashboard/hub"
                    ? pathname.startsWith("/dashboard/hub") && pathname !== "/dashboard/hub/new"
                    : pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));

                const adminHidden = isAdmin && visibility[item.key] === false;
                return (
                  <SidebarMenuItem key={item.to}>
                    <div className="relative flex items-center">
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="pr-9">
                        <Link to={item.to} className={`flex items-center gap-3 ${item.dimmed || adminHidden ? "opacity-50" : ""}`}>
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.label}</span>
                          {adminHidden && !collapsed && (
                            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Hidden
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                      {!collapsed && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              aria-label={`What is ${item.label}?`}
                              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 z-10"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="right"
                            align="start"
                            className="max-w-[260px] text-xs leading-snug z-50"
                          >
                            {item.tooltip}
                          </PopoverContent>
                        </Popover>

                      )}
                    </div>
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
