import { supabase } from "@/integrations/supabase/client";

// The generated Supabase types don't include our new tables yet, so we cast
// through a permissive shape for the new endpoints only.
const sbAny = supabase as unknown as {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (c: string, v: unknown) => { maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }> };
      order: (c: string, opts?: { ascending?: boolean }) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
  rpc: (name: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export type SlotStatus = "available" | "blocked" | "booked";

export type PrivateSessionSlot = {
  id: string;
  session_date: string; // YYYY-MM-DD
  start_time: string;   // HH:MM:SS
  end_time: string;
  status: SlotStatus;
};

export type PrivateSessionSettings = {
  price_cents: number;
  weeks_ahead: number;
  hold_minutes: number;
  location_label: string;
  contact_email: string | null;
};

export async function getPrivateSessionSettings(): Promise<PrivateSessionSettings> {
  const { data, error } = await sbAny
    .from("private_session_settings")
    .select("price_cents, weeks_ahead, hold_minutes, location_label, contact_email")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (
    (data as PrivateSessionSettings | null) ?? {
      price_cents: 29700,
      weeks_ahead: 8,
      hold_minutes: 15,
      location_label: "IGNITE Center · Greater Atlanta Christian School",
      contact_email: null,
    }
  );
}

export async function ensurePrivateSessionSlots(): Promise<void> {
  await sbAny.rpc("ensure_private_session_slots");
}

export async function listUpcomingPrivateSessionSlots(): Promise<PrivateSessionSlot[]> {
  const { data, error } = await sbAny.rpc("get_upcoming_private_session_slots");
  if (error) throw new Error(error.message);
  return (data as PrivateSessionSlot[]) ?? [];
}

export type ReserveInput = {
  slot_id: string;
  name: string;
  email: string;
  phone?: string;
  business_idea?: string;
  stage?: string;
  notes?: string;
};

export type ReserveResult = {
  booking_id: string;
  hold_expires_at: string;
  amount_cents: number;
};

export async function reservePrivateSessionSlot(input: ReserveInput): Promise<ReserveResult> {
  const { data, error } = await sb.rpc("reserve_private_session_slot", {
    _slot_id: input.slot_id,
    _name: input.name,
    _email: input.email,
    _phone: input.phone ?? null,
    _business_idea: input.business_idea ?? null,
    _stage: input.stage ?? null,
    _notes: input.notes ?? null,
  });
  if (error) throw new Error(error.message);
  const arr = data as ReserveResult[] | ReserveResult | null;
  const row = Array.isArray(arr) ? arr[0] : arr;
  if (!row) throw new Error("Reservation failed");
  return row;
}

export async function adminSetSlotStatus(
  slot_id: string,
  status: "available" | "blocked",
  reason?: string,
): Promise<void> {
  const { error } = await sb.rpc("admin_set_private_session_slot_status", {
    _slot_id: slot_id,
    _status: status,
    _reason: reason ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function adminListBookings() {
  const { data, error } = await supabase
    .from("private_session_bookings")
    .select("id, slot_id, name, email, phone, status, payment_status, amount_cents, created_at, confirmed_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Format helpers
export function formatSlotDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export function formatSlotTime(startTime: string, endTime: string): string {
  const fmt = (t: string) => {
    const [hh, mm] = t.split(":").map(Number);
    const suffix = hh >= 12 ? "PM" : "AM";
    const h12 = ((hh + 11) % 12) + 1;
    return mm === 0 ? `${h12} ${suffix}` : `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
  };
  return `${fmt(startTime)} – ${fmt(endTime)}`;
}
