import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listCohorts, upsertCohort, deleteCohort } from "@/lib/cohorts.functions";
import { DEFAULT_VENUE, DEFAULT_PRICING, formatPriceCents, type Cohort } from "@/lib/cohorts";
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
import { FlaskConical, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

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
  founders_price: string;   // dollars, as string for input
  founders_seats: string;
  cohort_price: string;
  cohort_seats: string;
  founders_display_floor: string;
  founders_warming_boost: string;
  founders_honest_threshold_pct: string;
  cohort_display_floor: string;
  cohort_warming_boost: string;
  cohort_honest_threshold_pct: string;
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
  founders_price: String(DEFAULT_PRICING.foundersPriceCents / 100),
  founders_seats: String(DEFAULT_PRICING.foundersSeats),
  cohort_price: String(DEFAULT_PRICING.cohortPriceCents / 100),
  cohort_seats: String(DEFAULT_PRICING.cohortSeats),
  founders_display_floor: "2",
  founders_warming_boost: "2",
  founders_honest_threshold_pct: "50",
  cohort_display_floor: "8",
  cohort_warming_boost: "2",
  cohort_honest_threshold_pct: "50",
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
  founders_price: String(c.foundersPriceCents / 100),
  founders_seats: String(c.foundersSeats),
  cohort_price: String(c.cohortPriceCents / 100),
  cohort_seats: String(c.cohortSeats),
  founders_display_floor: String(c.foundersDisplayFloor),
  founders_warming_boost: String(c.foundersWarmingBoost),
  founders_honest_threshold_pct: String(c.foundersHonestThresholdPct),
  cohort_display_floor: String(c.cohortDisplayFloor),
  cohort_warming_boost: String(c.cohortWarmingBoost),
  cohort_honest_threshold_pct: String(c.cohortHonestThresholdPct),
});

function clampInt(s: string, lo: number, hi: number): number {
  const n = Math.floor(Number(s) || 0);
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

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
    mutationFn: (vars: FormState) => {
      const foundersPriceCents = Math.round(Number(vars.founders_price) * 100);
      const cohortPriceCents = Math.round(Number(vars.cohort_price) * 100);
      const foundersSeats = Math.max(0, Math.floor(Number(vars.founders_seats) || 0));
      const cohortSeats = Math.max(0, Math.floor(Number(vars.cohort_seats) || 0));
      if (!Number.isFinite(foundersPriceCents) || foundersPriceCents < 0) {
        throw new Error("Founders price must be a non-negative number.");
      }
      if (!Number.isFinite(cohortPriceCents) || cohortPriceCents < 0) {
        throw new Error("Cohort price must be a non-negative number.");
      }
      if (foundersSeats + cohortSeats < 1) {
        throw new Error("Total seats must be at least 1.");
      }
      return upsertFn({
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
          founders_price_cents: foundersPriceCents,
          founders_seats: foundersSeats,
          cohort_price_cents: cohortPriceCents,
          cohort_seats: cohortSeats,
          founders_display_floor: clampInt(vars.founders_display_floor, 0, Math.max(foundersSeats - 1, 0)),
          founders_warming_boost: clampInt(vars.founders_warming_boost, 0, 500),
          founders_honest_threshold_pct: clampInt(vars.founders_honest_threshold_pct, 1, 100),
          cohort_display_floor: clampInt(vars.cohort_display_floor, 0, Math.max(cohortSeats - 1, 0)),
          cohort_warming_boost: clampInt(vars.cohort_warming_boost, 0, 500),
          cohort_honest_threshold_pct: clampInt(vars.cohort_honest_threshold_pct, 1, 100),
        },
      });
    },
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

  const totalSeatsPreview =
    (Number(form.founders_seats) || 0) + (Number(form.cohort_seats) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cohorts</h1>
          <p className="text-sm text-muted-foreground">
            Set the date, venue, pricing, and seat caps for each monthly workshop.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/cohorts/test">
              <FlaskConical className="mr-1.5 size-4" /> Test registration flow
            </Link>
          </Button>
          <Button
            onClick={() => {
              setForm(emptyForm());
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" /> Add cohort
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pricing / seats</th>
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
                  <td className="px-4 py-3 text-xs leading-relaxed">
                    <div>
                      Founders: <span className="text-foreground tabular-nums">{formatPriceCents(c.foundersPriceCents)}</span>{" "}
                      <span className="text-muted-foreground">× {c.foundersSeats}</span>
                    </div>
                    <div>
                      Cohort: <span className="text-foreground tabular-nums">{formatPriceCents(c.cohortPriceCents)}</span>{" "}
                      <span className="text-muted-foreground">× {c.cohortSeats}</span>
                    </div>
                    <div className="text-muted-foreground">Total {c.totalSeats} seats</div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Updated automatically based on paid seats. Override manually if needed.
                </p>
              </div>
              <div>
                <Label>Seats left override {form.status !== "filling" && <span className="text-xs text-muted-foreground">(only used when "Filling up")</span>}</Label>
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
              <div className="mb-3">
                <div className="text-sm font-medium">Pricing & seat caps</div>
                <div className="text-xs text-muted-foreground">
                  The first <span className="text-foreground">{form.founders_seats || 0}</span> paid seats use the Founders price.
                  Once full, new sign-ups automatically roll to the Cohort price.
                  Total capacity: <span className="text-foreground">{totalSeatsPreview} seats</span>.
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Founders price (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.founders_price}
                    onChange={(e) => setForm({ ...form, founders_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Founders seats</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.founders_seats}
                    onChange={(e) => setForm({ ...form, founders_seats: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cohort price (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.cohort_price}
                    onChange={(e) => setForm({ ...form, cohort_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cohort seats</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.cohort_seats}
                    onChange={(e) => setForm({ ...form, cohort_seats: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <div className="mb-3">
                <div className="text-sm font-medium">Scarcity display (psychology)</div>
                <div className="text-xs text-muted-foreground">
                  Controls what visitors see in the "X of N seats left" badge before real demand catches up.
                  Real seat counts, reservations, and emails always use the truth.
                </div>
              </div>
              <ScarcityFields
                tier="Founders"
                capacity={Number(form.founders_seats) || 0}
                floor={form.founders_display_floor}
                boost={form.founders_warming_boost}
                pct={form.founders_honest_threshold_pct}
                onFloor={(v) => setForm({ ...form, founders_display_floor: v })}
                onBoost={(v) => setForm({ ...form, founders_warming_boost: v })}
                onPct={(v) => setForm({ ...form, founders_honest_threshold_pct: v })}
              />
              <div className="my-3 border-t border-white/5" />
              <ScarcityFields
                tier="Cohort"
                capacity={Number(form.cohort_seats) || 0}
                floor={form.cohort_display_floor}
                boost={form.cohort_warming_boost}
                pct={form.cohort_honest_threshold_pct}
                onFloor={(v) => setForm({ ...form, cohort_display_floor: v })}
                onBoost={(v) => setForm({ ...form, cohort_warming_boost: v })}
                onPct={(v) => setForm({ ...form, cohort_honest_threshold_pct: v })}
              />
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

function ScarcityFields({
  tier, capacity, floor, boost, pct, onFloor, onBoost, onPct,
}: {
  tier: string;
  capacity: number;
  floor: string;
  boost: string;
  pct: string;
  onFloor: (v: string) => void;
  onBoost: (v: string) => void;
  onPct: (v: string) => void;
}) {
  const f = Math.min(Math.max(0, Math.floor(Number(floor) || 0)), Math.max(capacity - 1, 0));
  const p = Math.max(1, Math.min(100, Math.floor(Number(pct) || 50)));
  const coldLeft = Math.max(capacity - f, 0);
  const honestAt = Math.max(1, Math.ceil((capacity * p) / 100));
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-foreground">{tier} tier (capacity {capacity})</div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <Label className="text-xs">Cold-start floor</Label>
          <Input type="number" min={0} max={Math.max(capacity - 1, 0)} value={floor} onChange={(e) => onFloor(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Warming boost</Label>
          <Input type="number" min={0} value={boost} onChange={(e) => onBoost(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Honest threshold %</Label>
          <Input type="number" min={1} max={100} value={pct} onChange={(e) => onPct(e.target.value)} />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Cold start shows <span className="text-foreground">{coldLeft} of {capacity} seats left</span>;
        switches to real count at <span className="text-foreground">{honestAt} real signup{honestAt === 1 ? "" : "s"}</span>.
      </p>
    </div>
  );
}

