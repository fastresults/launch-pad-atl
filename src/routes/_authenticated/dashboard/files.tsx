import { Link } from 'react-router-dom';
import { FileText, Image, Sparkles } from "lucide-react";


export default function FilesIndex() {
  const sections = [
    { to: "/dashboard/deliverables", label: "Built with your co-founder", desc: "The 35 founder-ready startup assets your co-founder helps you craft — pitch, plan, strategy, the whole vibe.", icon: Sparkles },
    { to: "/dashboard/documents", label: "Your docs vault", desc: "Stuff you upload + startup assets you saved from the Hub. Receipts on lock.", icon: FileText },
    { to: "/dashboard/media", label: "Brand & visuals", desc: "Logos, palettes, photos, content drops — your startup's whole aesthetic in one place.", icon: Image },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">My files</h1>
        <p className="mt-2 text-muted-foreground">Your startup's home base — everything you've built together and everything you brought to the table.</p>

      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition"
          >
            <s.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 font-medium">{s.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
