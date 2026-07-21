import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Ban, CheckCircle2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ensurePrivateSessionSlots,
  listUpcomingPrivateSessionSlots,
  adminSetSlotStatus,
  adminListBookings,
  adminReleaseBooking,
  adminConfirmBooking,
  formatSlotDate,
  formatSlotTime,
  type PrivateSessionSlot,
} from "@/lib/private-sessions.functions";

export default function AdminPrivateSessionsPage() {
  const [slots, setSlots] = useState<PrivateSessionSlot[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      await ensurePrivateSessionSlots();
      const [s, b] = await Promise.all([
        listUpcomingPrivateSessionSlots(),
        adminListBookings(),
      ]);
      setSlots(s);
      setBookings(b as any[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(slot: PrivateSessionSlot) {
    setBusyId(slot.id);
    try {
      const next = slot.status === "blocked" ? "available" : "blocked";
      await adminSetSlotStatus(slot.id, next);
      toast.success(next === "blocked" ? "Slot blocked" : "Slot re-opened");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  // Group slots by date
  const grouped = new Map<string, PrivateSessionSlot[]>();
  for (const s of slots) {
    const arr = grouped.get(s.session_date) ?? [];
    arr.push(s);
    grouped.set(s.session_date, arr);
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Private Tuesday sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Block or open Tuesday slots at IGNITE. Bookings appear below.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-medium">Upcoming Tuesdays</h2>
            {Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => (
              <div key={date} className="mb-4 rounded-lg border p-4">
                <p className="font-medium">{formatSlotDate(date)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        s.status === "booked"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : s.status === "blocked"
                            ? "border-muted bg-muted/50 text-muted-foreground line-through"
                            : "border-border bg-card"
                      }`}
                    >
                      <span>{formatSlotTime(s.start_time, s.end_time)}</span>
                      {s.status === "booked" ? (
                        <span className="text-xs">booked</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === s.id}
                          onClick={() => toggle(s)}
                          className="h-6 px-2 text-xs"
                        >
                          {busyId === s.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : s.status === "blocked" ? (
                            <>
                              <RotateCcw className="mr-1 size-3" /> Open
                            </>
                          ) : (
                            <>
                              <Ban className="mr-1 size-3" /> Block
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Bookings</h2>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-t">
                        <td className="p-3">{b.name}</td>
                        <td className="p-3">{b.email}</td>
                        <td className="p-3">
                          {b.status === "confirmed" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 className="size-3" /> {b.status}
                            </span>
                          ) : (
                            b.status
                          )}
                        </td>
                        <td className="p-3">{b.payment_status}</td>
                        <td className="p-3">${(b.amount_cents / 100).toFixed(0)}</td>
                        <td className="p-3">{new Date(b.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
