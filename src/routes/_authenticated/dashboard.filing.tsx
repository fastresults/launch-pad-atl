import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyFiling, updateMyFiling } from "@/lib/filing.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/filing")({
  component: FilingPage,
  head: () => ({ meta: [{ title: "Filing Info" }] }),
});

const blank = {
  legal_first_name: "", legal_last_name: "", dob: "", ssn_last4: "", ssn_full: "",
  address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "US",
  llc_name: "", registered_agent_name: "", registered_agent_address: "", business_purpose: "",
};

function FilingPage() {
  const getFn = useServerFn(getMyFiling);
  const saveFn = useServerFn(updateMyFiling);
  const { data, refetch } = useQuery({ queryKey: ["my", "filing"], queryFn: () => getFn() });
  const [v, setV] = useState<Record<string, string>>(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data?.filing) return;
    const next: Record<string, string> = { ...blank };
    for (const k of Object.keys(blank)) next[k] = (data.filing[k as keyof typeof data.filing] as string) ?? "";
    setV(next);
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string | null> = {};
      for (const k of Object.keys(v)) payload[k] = v[k] ? v[k] : null;
      await saveFn({ data: payload as never });
      toast.success("Saved");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  const field = (k: keyof typeof blank, label: string, type = "text", placeholder?: string) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input type={type} value={v[k]} onChange={(e) => setV((s) => ({ ...s, [k]: e.target.value }))} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Filing info</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Used for your LLC packet, EIN letter, and bank checklist. Only you and your facilitator can see this.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">You</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field("legal_first_name", "Legal first name")}
          {field("legal_last_name", "Legal last name")}
          {field("dob", "Date of birth", "date")}
          {field("ssn_last4", "SSN (last 4)", "text", "1234")}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Full SSN (optional, needed for EIN / LLC)</Label>
          <Input
            type="password"
            value={v.ssn_full}
            onChange={(e) => setV((s) => ({ ...s, ssn_full: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
            placeholder="9 digits, no dashes"
          />
          <p className="text-xs text-muted-foreground">Protected by row-level security. Only you and admins can read this row.</p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Address</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field("address_line1", "Address line 1")}
          {field("address_line2", "Address line 2")}
          {field("city", "City")}
          {field("state", "State", "text", "GA")}
          {field("postal_code", "Postal code")}
          {field("country", "Country")}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Startup</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field("llc_name", "LLC name")}
          {field("registered_agent_name", "Registered agent name")}
        </div>
        {field("registered_agent_address", "Registered agent address")}
        <div className="space-y-1.5">
          <Label className="text-sm">Startup purpose</Label>
          <Textarea rows={3} value={v.business_purpose} onChange={(e) => setV((s) => ({ ...s, business_purpose: e.target.value }))} />
        </div>
      </section>

      <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save filing info"}</Button>
    </div>
  );
}
