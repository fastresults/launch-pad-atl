import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getMarketProfile, upsertMarketProfile } from "@/lib/discovery.functions";

const ARCHETYPES = [
  "Online",
  "Main-street brick-and-mortar",
  "Service-based",
  "Blue-collar trade",
  "Product",
  "Marketplace",
  "SaaS",
  "Hybrid",
];

const GEOGRAPHIES = ["Local city/region", "Regional", "National", "Global"];

const CHANNELS = [
  "In-person",
  "Website",
  "Marketplace (Amazon/Etsy)",
  "Social",
  "Referrals",
  "B2B sales",
];

const CUSTOMER_TYPES: Array<{ value: "b2c" | "b2b" | "both"; label: string }> = [
  { value: "b2c", label: "Consumers (B2C)" },
  { value: "b2b", label: "Other businesses (B2B)" },
  { value: "both", label: "Both" },
];

type Props = { onDone: () => void };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-white/10 bg-card hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

export function MarketBlock({ onDone }: Props) {
  const getFn = useServerFn(getMarketProfile);
  const saveFn = useServerFn(upsertMarketProfile);
  const { data, isLoading } = useQuery({ queryKey: ["my", "market-profile"], queryFn: () => getFn() });
  const p = (data?.profile ?? null) as Record<string, unknown> | null;

  const [archetype, setArchetype] = useState<string[]>((p?.archetype as string[]) ?? []);
  const [geography, setGeography] = useState<string>((p?.geography as string) ?? "");
  const [industry, setIndustry] = useState<string>((p?.industry as string) ?? "");
  const [channels, setChannels] = useState<string[]>((p?.channels as string[]) ?? []);
  const [customer, setCustomer] = useState<"b2c" | "b2b" | "both" | "">(
    ((p?.customer_type as "b2c" | "b2b" | "both") ?? "") || "",
  );
  const [note, setNote] = useState<string>((p?.market_note as string) ?? "");
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) => {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await saveFn({
        data: {
          archetype,
          geography: geography || null,
          industry: industry.trim() || null,
          channels,
          customer_type: customer || null,
          market_note: note.trim() || null,
        },
      });
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mt-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
          What kind of startup is this?
        </h1>
        <p className="mt-3 text-muted-foreground">Tap all that fit. Quick chips, no essays.</p>
      </div>

      <section>
        <div className="text-sm font-medium mb-2">Business archetype</div>
        <div className="flex flex-wrap gap-2">
          {ARCHETYPES.map((a) => (
            <Chip key={a} active={archetype.includes(a)} onClick={() => toggle(archetype, setArchetype, a)}>{a}</Chip>
          ))}
        </div>
      </section>

      <section>
        <div className="text-sm font-medium mb-2">Where you'll operate</div>
        <div className="flex flex-wrap gap-2">
          {GEOGRAPHIES.map((g) => (
            <Chip key={g} active={geography === g} onClick={() => setGeography(geography === g ? "" : g)}>{g}</Chip>
          ))}
        </div>
      </section>

      <section>
        <label className="text-sm font-medium">Industry / category</label>
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Coffee shop, home services, fintech…"
          className="mt-2 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
        />
      </section>

      <section>
        <div className="text-sm font-medium mb-2">Primary channel(s)</div>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <Chip key={c} active={channels.includes(c)} onClick={() => toggle(channels, setChannels, c)}>{c}</Chip>
          ))}
        </div>
      </section>

      <section>
        <div className="text-sm font-medium mb-2">Who pays?</div>
        <div className="flex flex-wrap gap-2">
          {CUSTOMER_TYPES.map((c) => (
            <Chip key={c.value} active={customer === c.value} onClick={() => setCustomer(customer === c.value ? "" : c.value)}>{c.label}</Chip>
          ))}
        </div>
      </section>

      <section>
        <label className="text-sm font-medium">Anything about this market we should know? <span className="text-muted-foreground">(optional)</span></label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-2 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
        />
      </section>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Continue <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
