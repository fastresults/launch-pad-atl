import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Send, CalendarDays, Users, Settings, Presentation, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type Action = { to: string; label: string; icon: LucideIcon; super?: boolean };

const ACTIONS: Action[] = [
  { to: "/admin/social/compose", label: "New social post", icon: Send, super: true },
  { to: "/admin/cohorts", label: "Cohort dates", icon: CalendarDays, super: true },
  { to: "/admin/attendees", label: "Attendee rosters", icon: Users },
  { to: "/admin/decks", label: "Facilitator decks", icon: Presentation },
  { to: "/admin/social", label: "Social accounts", icon: Megaphone, super: true },
  { to: "/admin/settings", label: "Site settings", icon: Settings, super: true },
];

export function QuickActions() {
  const { isSuperAdmin } = useAuth();
  const actions = ACTIONS.filter((a) => !a.super || isSuperAdmin);

  return (
    <section aria-labelledby="quick-actions">
      <h2
        id="quick-actions"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Quick actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.to} to={action.to} className="group">
              <Card className="flex h-full flex-col items-start gap-2 p-4 transition-colors group-hover:border-primary/50 group-hover:bg-accent/40">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium leading-tight">{action.label}</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
