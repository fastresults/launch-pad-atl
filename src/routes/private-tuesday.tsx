import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Sparkles, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import {
  ensurePrivateSessionSlots,
  listUpcomingPrivateSessionSlots,
  reservePrivateSessionSlot,
  getPrivateSessionSettings,
  formatSlotDate,
  formatSlotTime,
  type PrivateSessionSlot,
  type PrivateSessionSettings,
} from "@/lib/private-sessions.functions";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function PrivateTuesdayPage() {
  useDocumentTitle(
    "A Tuesday with Adam — 2 hours, 1-on-1 at IGNITE · $397",
    "Book a private 90-minute build session with Adam at the IGNITE Center in Atlanta. Tuesdays only. Same real build — just you and Adam at the table.",
  );

  const navigate = useNavigate();
  const [settings, setSettings] = useState<PrivateSessionSettings | null>(null);
  const [slots, setSlots] = useState<PrivateSessionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    business_idea: "",
    stage: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      try {
        await ensurePrivateSessionSlots();
        const [s, list] = await Promise.all([
          getPrivateSessionSettings(),
          listUpcomingPrivateSessionSlots(),
        ]);
        setSettings(s);
        setSlots(list);
      } catch (e) {
        console.error(e);
        toast.error("Couldn't load available times. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, PrivateSessionSlot[]>();
    for (const s of slots) {
      const arr = map.get(s.session_date) ?? [];
      arr.push(s);
      map.set(s.session_date, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  const priceLabel = settings ? `$${Math.round(settings.price_cents / 100)}` : "$397";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) {
      toast.error("Pick a time slot first.");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await reservePrivateSessionSlot({
        slot_id: selectedId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        business_idea: form.business_idea.trim() || undefined,
        stage: form.stage.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Seat held! Check your email for next steps.");
      navigate(`/contact?topic=private-tuesday&booking=${result.booking_id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Reservation failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="marketing-surface min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="border-b border-[#E4D9C4] bg-[#FAF8F5] py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9B99A] bg-[#F0EBE3] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#3D3025]">
              <Sparkles className="size-3.5" /> A Tuesday with Adam · 1-on-1 · {priceLabel}
            </p>
            <h1 className="font-serif text-4xl leading-[1.05] tracking-tight text-[#2A1F17] md:text-5xl lg:text-6xl">
              Just you and Adam,{" "}
              <span className="italic">at the table.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-[#5A4A3A] md:text-lg">
              Ninety minutes. One founder. Same real build as the workshop — landing page live,
              positioning locked, first outreach sent — except it's just the two of you,
              at IGNITE, on a Tuesday.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[#5A4A3A]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B99A] bg-white px-3 py-1">
                <MapPin className="size-3.5" /> IGNITE Center · Greater Atlanta Christian School
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B99A] bg-white px-3 py-1">
                <Calendar className="size-3.5" /> Tuesdays only
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9B99A] bg-white px-3 py-1">
                <Clock className="size-3.5" /> Four 90-min blocks · 9:30, 11:10, 12:50, 2:30
              </span>
            </div>
          </div>
        </section>

        {/* Booking */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-5">
              {/* Slot picker */}
              <div className="lg:col-span-3">
                <h2 className="font-serif text-2xl text-[#2A1F17] md:text-3xl">Pick your Tuesday.</h2>
                <p className="mt-2 text-sm text-[#5A4A3A]">
                  Times we still have open in the next {settings?.weeks_ahead ?? 8} weeks. Pick one and fill
                  out a few details — we'll hold your seat for {settings?.hold_minutes ?? 15} minutes while you confirm.
                </p>

                {loading ? (
                  <div className="mt-8 flex items-center gap-2 text-sm text-[#5A4A3A]">
                    <Loader2 className="size-4 animate-spin" /> Loading available times…
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="mt-8 rounded-lg border border-[#E4D9C4] bg-[#F5F0E5] p-6 text-sm text-[#5A4A3A]">
                    All Tuesdays are fully reserved. Email us and we'll open the next one for you.
                  </div>
                ) : (
                  <div className="mt-6 space-y-5">
                    {grouped.map(([date, list]) => (
                      <div key={date} className="rounded-lg border border-[#E4D9C4] bg-white p-5">
                        <p className="font-serif text-lg text-[#2A1F17]">{formatSlotDate(date)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {list.map((s) => {
                            const selected = selectedId === s.id;
                            const unavailable = s.status !== "available";
                            if (unavailable) {
                              return (
                                <div
                                  key={s.id}
                                  aria-disabled="true"
                                  className="cursor-not-allowed rounded-md border border-[#E4D9C4] bg-[#EFE7D6] px-3 py-2 text-sm text-[#9A8B75] line-through"
                                  title={s.status === "booked" ? "Reserved" : "Unavailable"}
                                >
                                  {formatSlotTime(s.start_time, s.end_time)}
                                  <span className="ml-2 text-[10px] uppercase tracking-wide no-underline">
                                    {s.status === "booked" ? "Reserved" : "Unavailable"}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setSelectedId(s.id)}
                                className={`rounded-md border px-3 py-2 text-sm transition ${
                                  selected
                                    ? "border-[#8B7355] bg-[#8B7355] hover:bg-[#6F5A42]"
                                    : "border-[#C9B99A] bg-[#FAF8F5] text-[#3D3025] hover:border-[#8B7355]"
                                }`}
                                style={selected ? { color: "#ffffff" } : undefined}
                              >
                                {selected && <CheckCircle2 className="mr-1 inline size-3.5" />}
                                {formatSlotTime(s.start_time, s.end_time)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form */}
              <div className="lg:col-span-2">
                <form
                  onSubmit={handleSubmit}
                  className="sticky top-24 rounded-lg border border-[#E4D9C4] bg-[#F5F0E5] p-6"
                >
                  <p className="font-serif text-xl text-[#2A1F17]">Reserve your seat</p>
                  <p className="mt-1 text-xs text-[#5A4A3A]">
                    {priceLabel} · payment link emailed after you reserve
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <Label htmlFor="name">Your name</Label>
                      <Input
                        id="name"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="business_idea">What are you building? (optional)</Label>
                      <Textarea
                        id="business_idea"
                        rows={3}
                        value={form.business_idea}
                        onChange={(e) => setForm({ ...form, business_idea: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !selectedId}
                    className="mt-6 w-full bg-[#8B7355] text-white hover:bg-[#6F5A42]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Holding your seat…
                      </>
                    ) : (
                      <>
                        Reserve this Tuesday <ArrowRight className="ml-1 size-4" />
                      </>
                    )}
                  </Button>
                  {!selectedId && (
                    <p className="mt-2 text-center text-xs text-[#8A7862]">
                      Pick a time on the left to continue.
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
