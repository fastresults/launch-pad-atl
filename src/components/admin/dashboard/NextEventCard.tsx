import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listCohorts } from "@/lib/cohorts.functions";
import { getNextAvailable, FALLBACK_COHORT, type Cohort } from "@/lib/cohorts";
import { listUpcomingPrivateSessionSlots } from "@/lib/private-sessions.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CalendarClock, MapPin } from "lucide-react";

export function NextEventCard() {
  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ["cohorts"],
    queryFn: listCohorts,
    staleTime: 60_000,
  });
  const { data: slots = [] } = useQuery({
    queryKey: ["admin", "private-slots", "upcoming"],
    queryFn: listUpcomingPrivateSessionSlots,
    staleTime: 60_000,
  });

  const cohort = getNextAvailable(cohorts) ?? FALLBACK_COHORT;
  const nextOpenSlot = (slots as any[]).find((s) => s.status === "open");
  const bookedCount = (slots as any[]).filter((s) => s.status !== "open").length;

  const slotLabel = nextOpenSlot
    ? new Date(nextOpenSlot.starts_at ?? nextOpenSlot.slot_start ?? Date.now()).toLocaleString(
        undefined,
        { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
      )
    : "No open blocks";

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Next workshop
        </div>
        <div className="mt-2 text-lg font-semibold">{cohort.dateLabel}</div>
        <div className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{cohort.venueName}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {cohort.status.replace("_", " ")}
          </Badge>
          {typeof cohort.seatsLeft === "number" && (
            <span className="text-xs text-muted-foreground">{cohort.seatsLeft} seats left</span>
          )}
          <Link
            to="/admin/cohorts"
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            Manage
          </Link>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          Next Private Tuesday
        </div>
        <div className="mt-2 text-lg font-semibold">{slotLabel}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {bookedCount} block{bookedCount === 1 ? "" : "s"} held or confirmed
        </p>
        <Link
          to="/admin/private-sessions"
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          Manage bookings
        </Link>
      </Card>
    </div>
  );
}
