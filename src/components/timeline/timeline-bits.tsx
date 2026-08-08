/** Small typographic pieces shared by the step panel, the list, and the hover card. */

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-0.5 text-[13px] text-white/85">{value}</div>
    </div>
  );
}

export function Head({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-white/40">{children}</p>;
}

export const LANE_TINT: Record<string, string> = {
  founder: "hsl(38 92% 58%)",
  builder: "hsl(199 89% 60%)",
  marketer: "hsl(280 70% 68%)",
};
