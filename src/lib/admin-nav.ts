import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Inbox,
  CalendarRange,
  Settings,
  Image as ImageIcon,
  Shield,
  ExternalLink,
  MessageSquare,
  Share2,
  Send,
  BarChart3,
  Rocket,
  Video,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "Operations" | "Content" | "Social" | "System";
  super?: boolean;
  badgeKey?: "reviewPending" | "applicationsPending" | "inquiriesNew" | "membersPending";
  external?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },

  { to: "/admin/members", label: "Members", icon: Shield, group: "Operations", badgeKey: "membersPending" },
  { to: "/admin/applications", label: "Applications", icon: FileText, group: "Operations", badgeKey: "applicationsPending" },
  { to: "/admin/registrations", label: "Registrations", icon: ClipboardList, group: "Operations" },
  { to: "/admin/private-sessions", label: "Private Tuesdays", icon: CalendarRange, group: "Operations" },
  { to: "/admin/attendees", label: "Attendees", icon: Users, group: "Operations" },
  { to: "/admin/hub", label: "Founders Hub", icon: Sparkles, group: "Operations" },
  { to: "/admin/review", label: "Review queue", icon: Inbox, group: "Operations", super: true, badgeKey: "reviewPending" },
  { to: "/admin/inquiries", label: "Inquiries", icon: MessageSquare, group: "Operations", badgeKey: "inquiriesNew" },
  { to: "/admin/cohorts", label: "Cohorts", icon: CalendarRange, group: "Operations", super: true },


  
  { to: "/admin/media", label: "Media library", icon: ImageIcon, group: "Content", super: true },
  { to: "/admin/decks", label: "Facilitator decks", icon: Sparkles, group: "Content" },
  { to: "/admin/testimonials", label: "Video testimonials", icon: Video, group: "Content" },

  { to: "/admin/social/setup", label: "Setup wizard", icon: Rocket, group: "Social", super: true },
  { to: "/admin/social/setup/intake", label: "AI Brand Intake", icon: Sparkles, group: "Social", super: true },
  { to: "/admin/social/setup/creative", label: "Creative Studio", icon: ImageIcon, group: "Social", super: true },
  { to: "/admin/social", label: "Profiles & accounts", icon: Share2, group: "Social", super: true },
  { to: "/admin/social/compose", label: "New post", icon: Send, group: "Social", super: true },
  { to: "/admin/social/posts", label: "Posts", icon: MessageSquare, group: "Social", super: true },
  { to: "/admin/social/analytics", label: "Analytics", icon: BarChart3, group: "Social", super: true },

  { to: "/admin/users", label: "Users & roles", icon: Shield, group: "System", super: true },
  { to: "/admin/settings", label: "Site settings", icon: Settings, group: "System", super: true },
  { to: "/", label: "View public site", icon: ExternalLink, group: "System", external: true },
];

export const ADMIN_GROUPS: AdminNavItem["group"][] = [
  "Overview",
  "Operations",
  "Content",
  "Social",
  "System",
];
