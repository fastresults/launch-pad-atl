import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { listCohorts } from "@/lib/cohorts.functions";
import { getCohortAvailability } from "@/lib/cohort-availability.functions";
import {
  simulatePaidRegistrations,
  resetTestRegistrations,
  listCohortRegistrations,
  confirmRegistrationPayment,
  markRegistrationRefunded,
} from "@/lib/registrations.functions";
import { formatPriceCents } from "@/lib/cohorts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/cohorts/test")({
  component: CohortTestPage,
  head: () => ({ meta: [{ title: "Test registration flow — Admin" }] }),
});

function CohortTestPage() {
  const { isSuperAdmin, loading } = useAuth();
  const qc = useQueryClient();

  const listFn = useServerFn(listCohorts);
  const availFn = useServerFn(getCohortAvailability);
  const simulateFn = useServerFn(simulatePaidRegistrations);
  const resetFn = useServerFn(resetTestRegistrations);
  const listRegsFn = useServerFn(listCohortRegistrations);
  const confirmFn = useServerFn(confirmRegistrationPayment);
  const refundFn = useServerFn(markRegistrationRefunded);

  const { data: cohorts = [] } = useQuery({
    queryKey: ["cohorts"],
    queryFn: () => listFn(),
  });

  const [cohortId, setCohortId] = useState<string>("");
  const effectiveId = cohortId || cohorts[0]?.id || "";
  const selected = cohorts.find((c) => c.id === effectiveId);

  const { data: avail } = useQuery({
    queryKey: ["cohort-availability", effectiveId],
    queryFn: () => availFn({ data: { cohort_id: effectiveId } }),
    enabled: Boolean(effectiveId),
    refetchInterval: 2000,
  });

  const { data: regsData } = useQuery({
    queryKey: ["cohort-regs", effectiveId],
    queryFn: () => listRegsFn({ data: { cohort_id: effectiveId, limit: 25 } }),
    enabled: Boolean(effectiveId),
    refetchInterval: 2000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cohort-availability", effectiveId] });
    qc.invalidateQueries({ queryKey: ["cohort-regs", effectiveId] });
    qc.invalidateQueries({ queryKey: ["cohorts"] });
  };

  const simulate = useMutation({
    mutationFn: (count: number) => simulateFn({ data: { cohort_id: effectiveId, count } }),
    onSuccess: (r) => {
      toast.success(`Simulated ${r.created.length} paid registration${r.created.length === 1 ? "" : "s"}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () => resetFn({ data: { cohort_id: effectiveId } }),
    onSuccess: (r) => {
      toast.success(`Deleted ${r.deleted} test registration${r.deleted === 1 ? "" : "s"}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => confirmFn({ data: { registration_id: id } }),
    onSuccess: () => { toast.success("Marked as paid"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const refund = useMutation({
    mutationFn: (id: string) => refundFn({ data: { registration_id: id } }),
    onSuccess: () => { toast.success("Marked as refunded"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to="/admin/cohorts">
              <ArrowLeft className="mr-1.5 size-4" /> Back to cohorts
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Test registration flow</h1>
          <p className="text-sm text-muted-foreground">
            Simulate paid registrations to verify Founders → Cohort tier roll-over and sold-out behavior.
            All test rows are tagged <code className="rounded bg-white/10 px-1 text-xs">__test__</code> and can be removed with one click.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Pick a cohort
            </div>
            <Select value={effectiveId} onValueChange={setCohortId}>
              <SelectTrigger><SelectValue placeholder="Select cohort…" /></SelectTrigger>
              <SelectContent>
                {cohorts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.dateLabel} · {c.cityLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <div className="mt-3 text-xs text-muted-foreground">
                Capacity: {selected.totalSeats} seats ·{" "}
                {formatPriceCents(selected.foundersPriceCents)} × {selected.foundersSeats} /{" "}
                {formatPriceCents(selected.cohortPriceCents)} × {selected.cohortSeats}
              </div>
            )}
          </div>

          {avail && selected && (
            <div className="rounded-xl border border-white/10 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Live availability
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    avail.isActiveCohort
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {avail.isActiveCohort ? "Active · scarcity live" : "Inactive · honest only"}
                </span>
              </div>
              <TierRow
                label="Founders"
                price={formatPriceCents(selected.foundersPriceCents)}
                taken={avail.founders.taken}
                capacity={avail.founders.capacity}
                displayed={avail.founders.displayedTaken}
              />
              <TierRow
                label="Cohort"
                price={formatPriceCents(selected.cohortPriceCents)}
                taken={avail.cohort.taken}
                capacity={avail.cohort.capacity}
                displayed={avail.cohort.displayedTaken}
              />

              <div className="border-t border-white/5 pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total paid</span>
                  <span className="tabular-nums">
                    {avail.totalTaken} / {avail.totalCapacity}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Next tier shown to users</span>
                  <span className="tabular-nums">
                    {avail.cohortSoldOut
                      ? "—"
                      : avail.nextTier === "founders"
                      ? `Founders (${formatPriceCents(selected.foundersPriceCents)})`
                      : `Cohort (${formatPriceCents(selected.cohortPriceCents)})`}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Cohort status</span>
                  <span>{avail.cohortSoldOut ? "Sold out" : avail.totalTaken > 0 ? "Filling" : "Open"}</span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-card p-4 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Simulate
            </div>
            <Button
              className="w-full"
              disabled={!effectiveId || simulate.isPending}
              onClick={() => simulate.mutate(1)}
            >
              <Zap className="mr-1.5 size-4" /> +1 paid registration
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={!effectiveId || !selected || simulate.isPending}
              onClick={() => {
                if (!selected || !avail) return;
                const need = Math.max(selected.foundersSeats - avail.founders.taken, 0);
                if (need === 0) {
                  toast.info("Founders is already full");
                  return;
                }
                simulate.mutate(need);
              }}
            >
              Fill Founders tier
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={!effectiveId || !selected || simulate.isPending}
              onClick={() => {
                if (!selected || !avail) return;
                const need = avail.totalRemaining;
                if (need === 0) {
                  toast.info("Cohort is already sold out");
                  return;
                }
                simulate.mutate(need);
              }}
            >
              Sell out cohort
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={!effectiveId || reset.isPending}
              onClick={() => {
                if (confirm("Delete all test registrations for this cohort?")) reset.mutate();
              }}
            >
              <RotateCcw className="mr-1.5 size-4" /> Reset test data
            </Button>
            <p className="text-[11px] text-muted-foreground pt-1">
              "Reset" only removes test rows. Real registrations are untouched.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <div className="text-sm font-medium">Recent registrations</div>
            <div className="text-xs text-muted-foreground">
              Use "Mark paid" to take a real pending row through the seat-reservation flow.
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Who</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Tier (req → assigned)</th>
                <th className="px-4 py-2">Paid</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(regsData?.rows ?? []).length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No registrations yet.</td></tr>
              ) : (
                (regsData?.rows ?? []).map((r) => {
                  const row = r as {
                    id: string; name: string; email: string;
                    status: string; tier_interest: string | null;
                    assigned_tier: string | null; price_paid_cents: number | null;
                    referral_source: string | null;
                  };
                  const isTest = row.referral_source === "__test__";
                  const isPaid = row.status === "paid" || row.status === "confirmed";
                  return (
                    <tr key={row.id} className="border-t border-white/5">
                      <td className="px-4 py-2">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.email}
                          {isTest && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">TEST</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          row.status === "paid" || row.status === "confirmed"
                            ? "bg-emerald-400/15 text-emerald-300"
                            : row.status === "refunded" || row.status === "cancelled"
                            ? "bg-white/5 text-muted-foreground"
                            : "bg-amber-400/15 text-amber-300"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {row.tier_interest ?? "—"} → <span className="text-foreground">{row.assigned_tier ?? "—"}</span>
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {row.price_paid_cents != null ? formatPriceCents(row.price_paid_cents) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isPaid ? (
                          <Button size="sm" variant="outline" disabled={refund.isPending}
                            onClick={() => refund.mutate(row.id)}>
                            Mark refunded
                          </Button>
                        ) : (
                          <Button size="sm" disabled={markPaid.isPending}
                            onClick={() => markPaid.mutate(row.id)}>
                            Mark paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TierRow({ label, price, taken, capacity, displayed }: { label: string; price: string; taken: number; capacity: number; displayed?: number }) {
  const pct = capacity > 0 ? Math.min(100, (taken / capacity) * 100) : 0;
  const full = taken >= capacity;
  const showDisplayed = typeof displayed === "number" && displayed !== taken;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label} <span className="text-muted-foreground tabular-nums">· {price}</span></span>
        <span className="tabular-nums text-xs">
          {taken} / {capacity} {full && <span className="text-amber-300">· full</span>}
          {showDisplayed && (
            <span className="ml-2 text-amber-300">· shown as {displayed}</span>
          )}
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full ${full ? "bg-amber-400/60" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
