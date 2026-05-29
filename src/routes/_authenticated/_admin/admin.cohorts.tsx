import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listCohorts, upsertCohort, deleteCohort } from "@/lib/cohorts.functions";
import { DEFAULT_VENUE, type Cohort } from "@/lib/cohorts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/cohorts")({
  component: CohortsAdminPage,
  head: () => ({ meta: [{ title: "Cohorts — Admin" }] }),
});

type FormState = {
  id?: string;
  cohort_date: string;
  tz: "EDT" | "EST";
  start_time: string;
  end_time: string;
  status: "open" | "filling" | "sold_out";
  seats_left: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_region: string;
  venue_postal: string;
};

const emptyForm = (): FormState => ({
  cohort_date: "",
  tz: "EDT",
  start_time: "08:00",
  end_time: "16:30",
  status: "open",
  seats_left: "",
  venue_name: DEFAULT_VENUE.name,
  venue_address: DEFAULT_VENUE.address,
  venue_city: DEFAULT_VENUE.city,
  venue_region: DEFAULT_VENUE.region,
  venue_postal: DEFAULT_VENUE.postal,
});

const fromCohort = (c: Cohort): FormState => ({
  id: c.id,
  cohort_date: c.id,
  tz: c.startISO.endsWith("-04:00") ? "EDT" : "EST",
  start_time: c.startISO.slice(11, 16),
  end_time: c.endISO.slice(11, 16),
  status: c.status,
  seats_left: typeof c.seatsLeft === "number" ? String(c.seatsLeft) : "",
  venue_name: c.venueName,
  venue_address: c.venueAddress,
  venue_city: c.venueCity,
  venue_region: c.venueRegion,
  venue_postal: c.venuePostal,
});

function CohortsAdminPage() {
  const { isSuperAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(listCohorts);
  const upsertFn = useServerFn(upsertCohort);
  const deleteFn = useServerFn(deleteCohort);

  const { data: cohorts = [], isLoading } = useQuery({
    queryKey: ["cohorts"],
    queryFn: () => listFn(),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const upsert = useMutation({
    mutationFn: (vars: FormState) =>
      upsertFn({
        data: {
          id: vars.id,
          cohort_date: vars.cohort_date,
          tz: vars.tz,
          start_time: vars.start_time,
          end_time: vars.end_time,
          status: vars.status,
          seats_left: vars.seats_left ? Number(vars.seats_left) : null,
          venue_name: vars.venue_name.trim(),
          venue_address: vars.venue_address.trim(),
          venue_city: vars.venue_city.trim(),
          venue_region: vars.venue_region.trim(),
          venue_postal: vars.venue_postal.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Cohort saved");
      qc.invalidateQueries({ queryKey: ["cohorts"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Cohort deleted");
      qc.invalidateQueries({ queryKey: ["cohorts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  const isDefaultVenueForm =
    form.venue_name === DEFAULT_VENUE.name &&
    form.venue_address === DEFAULT_VENUE.address &&
    form.venue_city === DEFAULT_VENUE.city &&
    form.venue_region === DEFAULT_VENUE.region &&
    form.venue_postal === DEFAULT_VENUE.postal;

  const resetVenue = () =>
    setForm((f) => ({
      ...f,
      venue_name: DEFAULT_VENUE.name,
      venue_address: DEFAULT_VENUE.address,
      venue_city: DEFAULT_VENUE.city,
      venue_region: DEFAULT_VENUE.region,
      venue_postal: DEFAULT_VENUE.postal,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cohorts</h1>
          <p className="text-sm text-muted-foreground">
            Set the date, venue, and status for each monthly workshop.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm());
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 size-4" /> Add cohort
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Seats</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : cohorts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No cohorts yet.</td></tr>
            ) : (
              cohorts.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium">{c.dateLabel}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.startISO.slice(11, 16)} – {c.endISO.slice(11, 16)} ({c.startISO.endsWith("-04:00") ? "EDT" : "EST"})
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      c.status === "sold_out" ? "bg-white/5 text-muted-foreground" :
                      c.status === "filling" ? "bg-amber-400/15 text-amber-300" :
                      "bg-emerald-400/15 text-emerald-300"
                    }`}>
                      {c.status === "sold_out" ? "Sold out" : c.status === "filling" ? "Filling" : "Open"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof c.seatsLeft === "number" ? c.seatsLeft : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.isDefaultVenue ? (
                      <span className="text-muted-foreground">Default · {c.cityLabel}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2 py-0.5 text-amber-200">
                        <MapPin className="size-3" /> {c.cityLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setForm(fromCohort(c)); setOpen(true); }}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete cohort ${c.dateLabel}?`)) del.mutate(c.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit cohort" : "Add cohort"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.cohort_date}
                  onChange={(e) => setForm({ ...form, cohort_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Time zone</Label>
                <Select value={form.tz} onValueChange={(v) => setForm({ ...form, tz: v as "EDT" | "EST" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EDT">EDT (Mar–Nov)</SelectItem>
                    <SelectItem value="EST">EST (Nov–Mar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FormState["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="filling">Filling up</SelectItem>
                    <SelectItem value="sold_out">Sold out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Seats left {form.status !== "filling" && <span className="text-xs text-muted-foreground">(only used when "Filling up")</span>}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.seats_left}
                  onChange={(e) => setForm({ ...form, seats_left: e.target.value })}
                  disabled={form.status !== "filling"}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Venue</div>
                  <div className={`text-xs ${isDefaultVenueForm ? "text-emerald-300" : "text-amber-300"}`}>
                    {isDefaultVenueForm
                      ? "Default venue ✓"
                      : "Custom venue — will show a 'Different location' callout to users"}
                  </div>
                </div>
                {!isDefaultVenueForm && (
                  <Button variant="outline" size="sm" onClick={resetVenue}>
                    Use default venue
                  </Button>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Venue name</Label>
                  <Input value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Street address</Label>
                  <Input value={form.venue_address} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.venue_city} onChange={(e) => setForm({ ...form, venue_city: e.target.value })} />
                </div>
                <div>
                  <Label>State / region</Label>
                  <Input value={form.venue_region} onChange={(e) => setForm({ ...form, venue_region: e.target.value })} />
                </div>
                <div>
                  <Label>Postal code</Label>
                  <Input value={form.venue_postal} onChange={(e) => setForm({ ...form, venue_postal: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save cohort"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
