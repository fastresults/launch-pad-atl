import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminBadges } from "@/lib/admin-badges.functions";
import { Card } from "@/components/ui/card";
import { FileText, ShieldCheck, MessagesSquare, Inbox, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tile = {
  key: keyof Awaited<ReturnType<typeof getAdminBadges>>;
  label: string;
  sub: string;
  to: string;
  icon: LucideIcon;
};

const TILES: Tile[] = [
  {
    key: "applicationsPending",
    label: "Applications to review",
    sub: "Applied or in review",
    to: "/admin/applications",
    icon: FileText,
  },
  {
    key: "membersPending",
    label: "Members awaiting approval",
    sub: "Submitted intakes",
    to: "/admin/members",
    icon: ShieldCheck,
  },
  {
    key: "inquiriesNew",
    label: "New inquiries",
    sub: "Nobody has replied yet",
    to: "/admin/inquiries",
    icon: MessagesSquare,
  },
  {
    key: "reviewPending",
    label: "Assets in review queue",
    sub: "Waiting on your approval",
    to: "/admin/review",
    icon: Inbox,
  },
];

export function TriageCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "badges"],
    queryFn: getAdminBadges,
    staleTime: 30_000,
  });

  const active = TILES.filter((t) => (data?.[t.key] ?? 0) > 0);
  const allClear = !isLoading && active.length === 0;

  return (
    <section aria-labelledby="needs-you-now">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="needs-you-now" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Needs you now
        </h2>
      </div>

      {allClear ? (
        <Card className="flex items-center gap-3 p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-medium">All clear</div>
            <p className="text-xs text-muted-foreground">
              No applications, members, inquiries or assets are waiting on you.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(isLoading ? TILES : active).map((tile) => {
            const Icon = tile.icon;
            const count = data?.[tile.key] ?? 0;
            return (
              <Link key={tile.key} to={tile.to} className="group">
                <Card className="h-full p-4 transition-colors group-hover:border-primary/50 group-hover:bg-accent/40">
                  <div className="flex items-start justify-between gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-semibold tabular-nums">
                      {isLoading ? "—" : count}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-medium leading-tight">{tile.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{tile.sub}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
