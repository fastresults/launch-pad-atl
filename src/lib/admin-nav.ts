import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Inbox,
  CalendarRange,
  CalendarClock,
  CalendarDays,
  Settings,
  Image as ImageIcon,
  ShieldCheck,
  UserCog,
  ExternalLink,
  MessageSquare,
  MessagesSquare,
  Share2,
  Send,
  BarChart3,
  Rocket,
  Video,
  Sparkles,
  Presentation,
  Wand2,
  Megaphone,
  type LucideIcon,
  Plus,
} from "lucide-react";

export type AdminGroup =
  | "Home"
  | "People"
  | "Schedule"
  | "Workspace"
  | "Marketing"
  | "System";

export type AdminBadgeKey =
  | "reviewPending"
  | "applicationsPending"
  | "inquiriesNew"
  | "membersPending";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: AdminGroup;
  /** Short "what is this page for" line shown under the label / in search. */
  description?: string;
  /** Extra search terms for the command palette. */
  keywords?: string[];
  super?: boolean;
  badgeKey?: AdminBadgeKey;
  external?: boolean;
  /** Nested sub-navigation (rendered as a collapsible submenu). */
  children?: AdminNavItem[];
};

export const ADMIN_GROUP_META: Record<AdminGroup, { label: string; hint: string }> = {
  Home: { label: "Home", hint: "At-a-glance triage" },
  People: { label: "People", hint: "Who is in the program" },
  Schedule: { label: "Schedule", hint: "What is happening when" },
  Workspace: { label: "Workspace", hint: "The work being produced" },
  Marketing: { label: "Marketing", hint: "Reach and content" },
  System: { label: "System", hint: "Access and configuration" },
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "Home",
    description: "What needs you right now",
    keywords: ["home", "overview", "triage", "stats", "today"],
  },

  // ---------------------------------------------------------------- People
  {
    to: "/admin/members",
    label: "Members",
    icon: ShieldCheck,
    group: "People",
    description: "Accounts, access and status",
    keywords: ["approve", "pending", "pause", "reject", "access", "intake", "roster"],
    badgeKey: "membersPending",
  },
  {
    to: "/admin/applications",
    label: "Applications",
    icon: FileText,
    group: "People",
    description: "Inbound founder applicants",
    keywords: ["applicants", "applied", "shortlist", "select", "waitlist"],
    badgeKey: "applicationsPending",
  },
  {
    to: "/admin/attendees",
    label: "Attendees",
    icon: Users,
    group: "People",
    description: "Workshop rosters and their work",
    keywords: ["founders", "students", "deliverables", "workflow", "impersonate"],
  },
  {
    to: "/admin/inquiries",
    label: "Inquiries",
    icon: MessagesSquare,
    group: "People",
    description: "Landing and contact messages",
    keywords: ["contact", "leads", "messages", "reply", "interest"],
    badgeKey: "inquiriesNew",
  },

  // -------------------------------------------------------------- Schedule
  {
    to: "/admin/registrations",
    label: "Registrations",
    icon: ClipboardList,
    group: "Schedule",
    description: "Workshop signups",
    keywords: ["signups", "seats", "confirmed", "tickets"],
  },
  {
    to: "/admin/private-sessions",
    label: "Private Tuesdays",
    icon: CalendarClock,
    group: "Schedule",
    description: "One-on-one bookings",
    keywords: ["1:1", "one on one", "slots", "bookings", "hold", "release"],
  },
  {
    to: "/admin/cohorts",
    label: "Cohorts",
    icon: CalendarDays,
    group: "Schedule",
    description: "Dates, capacity and venue",
    keywords: ["dates", "venue", "capacity", "pricing", "workshop date"],
    super: true,
  },

  // ------------------------------------------------------------- Workspace
  {
    to: "/admin/hub",
    label: "Founders Hub",
    icon: Sparkles,
    group: "Workspace",
    description: "Venture snapshots and assets",
    keywords: ["ventures", "snapshots", "ideas", "assets", "new venture"],
  },
  {
    to: "/admin/hub/new",
    label: "New venture",
    icon: Plus,
    group: "Workspace",
    description: "Create an admin-only venture",
    keywords: ["new", "create", "venture", "snapshot", "internal", "add"],
    super: true,
  },
  {
    to: "/admin/review",
    label: "Review queue",
    icon: Inbox,
    group: "Workspace",
    description: "Assets waiting on approval",
    keywords: ["approve", "pending review", "quality", "queue"],
    super: true,
    badgeKey: "reviewPending",
  },
  {
    to: "/admin/decks",
    label: "Facilitator decks",
    icon: Presentation,
    group: "Workspace",
    description: "Slides used in the room",
    keywords: ["slides", "workshop", "presentation", "deck"],
  },
  {
    to: "/admin/media",
    label: "Media library",
    icon: ImageIcon,
    group: "Workspace",
    description: "Shared images and files",
    keywords: ["images", "uploads", "files", "photos", "assets"],
    super: true,
  },
  {
    to: "/admin/testimonials",
    label: "Video testimonials",
    icon: Video,
    group: "Workspace",
    description: "Founder video proof",
    keywords: ["video", "proof", "social proof", "reviews"],
  },
  {
    to: "/admin/video-wall",
    label: "Founder video wall",
    icon: Video,
    group: "Workspace",
    description: "Videos shown below the hero",
    keywords: ["video", "wall", "hero", "founder", "stories", "testimonial"],
    super: true,
  },
  {
    to: "/admin/audits",
    label: "Workshop audits",
    icon: ClipboardList,
    group: "Workspace",
    description: "Review and release pre-workshop attendee audits",
    keywords: ["audit", "workshop", "intake", "grade", "prework", "review"],
    super: true,
  },
  {
    to: "/admin/hero-images",
    label: "Hero images",
    icon: ImageIcon,
    group: "Workspace",
    description: "Review and regenerate workshop hero photos",
    keywords: ["hero", "images", "workshop", "photos", "generate", "prompt", "scenes"],
    super: true,
  },


  // ------------------------------------------------------------- Marketing
  {
    to: "/admin/social",
    label: "Social",
    icon: Megaphone,
    group: "Marketing",
    description: "Accounts, posts and campaigns",
    keywords: ["social", "marketing", "posts", "campaign"],
    super: true,
    children: [
      {
        to: "/admin/social",
        label: "Profiles & accounts",
        icon: Share2,
        group: "Marketing",
        description: "Connected platforms",
        keywords: ["connect", "accounts", "instagram", "linkedin", "facebook"],
        super: true,
      },
      {
        to: "/admin/social/compose",
        label: "New post",
        icon: Send,
        group: "Marketing",
        description: "Write and schedule a post",
        keywords: ["compose", "publish", "schedule", "write"],
        super: true,
      },
      {
        to: "/admin/social/posts",
        label: "Posts",
        icon: MessageSquare,
        group: "Marketing",
        description: "Everything queued and published",
        keywords: ["queue", "published", "drafts", "history"],
        super: true,
      },
      {
        to: "/admin/social/analytics",
        label: "Analytics",
        icon: BarChart3,
        group: "Marketing",
        description: "Reach and engagement",
        keywords: ["stats", "reach", "engagement", "performance"],
        super: true,
      },
      {
        to: "/admin/social/setup",
        label: "Setup wizard",
        icon: Rocket,
        group: "Marketing",
        description: "Connect platforms step by step",
        keywords: ["onboarding", "connect", "wizard"],
        super: true,
      },
      {
        to: "/admin/social/setup/intake",
        label: "Brand intake",
        icon: Wand2,
        group: "Marketing",
        description: "AI brand questionnaire",
        keywords: ["brand", "ai", "intake", "voice"],
        super: true,
      },
      {
        to: "/admin/social/setup/creative",
        label: "Creative Studio",
        icon: ImageIcon,
        group: "Marketing",
        description: "Generate creative assets",
        keywords: ["images", "generate", "creative", "ads"],
        super: true,
      },
    ],
  },

  // ---------------------------------------------------------------- System
  {
    to: "/admin/users",
    label: "Users & roles",
    icon: UserCog,
    group: "System",
    description: "Grant admin access or view the app as a user",
    keywords: ["roles", "permissions", "admin", "super admin", "grant", "impersonate", "view as", "sign in as", "act as"],
    super: true,
  },
  {
    to: "/admin/settings",
    label: "Site settings",
    icon: Settings,
    group: "System",
    description: "Landing mode, nav and global config",
    keywords: ["landing only", "toggle", "config", "settings", "nav visibility"],
    super: true,
  },
  {
    to: "/",
    label: "View public site",
    icon: ExternalLink,
    group: "System",
    description: "Open the live site in a new tab",
    keywords: ["public", "live", "preview", "website"],
    external: true,
  },
];

export const ADMIN_GROUPS: AdminGroup[] = [
  "Home",
  "People",
  "Schedule",
  "Workspace",
  "Marketing",
  "System",
];

/** Flattened list (parents + children) for search, breadcrumbs and matching. */
export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV.flatMap((item) =>
  item.children && item.children.length > 0 ? [item, ...item.children] : [item],
);

/** Groups that render collapsed by default unless the active route lives inside. */
export const ADMIN_COLLAPSED_GROUPS: AdminGroup[] = ["Marketing"];

export function isNavItemActive(pathname: string, to: string) {
  if (to === "/admin") return pathname === "/admin";
  // Keep parent/child siblings from both lighting up (e.g. /admin/hub vs /admin/hub/new).
  if (to === "/admin/hub") return pathname === "/admin/hub";
  return pathname === to || pathname.startsWith(to + "/");
}
