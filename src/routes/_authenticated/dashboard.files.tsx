import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Image, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/files")({
  component: FilesIndex,
  head: () => ({ meta: [{ title: "My files — Startup Labs" }] }),
});

function FilesIndex() {
  const sections = [
    { to: "/dashboard/deliverables", label: "Made by your AI", desc: "The 25 deliverables your AI assistant builds for you.", icon: Sparkles },
    { to: "/dashboard/documents", label: "Documents", desc: "PDFs, contracts, and other docs.", icon: FileText },
    { to: "/dashboard/media", label: "Photos & media", desc: "Logos, brand assets, photos.", icon: Image },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">My files</h1>
        <p className="mt-2 text-muted-foreground">Everything we've made for you, and everything you've uploaded.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="rounded-2xl border border-white/10 bg-card p-5 hover:border-primary/30 transition"
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
