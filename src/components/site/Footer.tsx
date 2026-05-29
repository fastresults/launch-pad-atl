import logoUrl from "@/assets/startuplabs-logo.svg";
import evolveLogoUrl from "@/assets/evolve-logo.svg";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Startuplabs" className="h-10 w-auto" />
          <span>· Norcross, GA</span>
        </div>
        <div className="text-center">© {new Date().getFullYear()} · One day. One business.</div>
        <div className="flex items-center gap-2">
          <span>A division of</span>
          <img src={evolveLogoUrl} alt="Evolve Inc." className="h-8 w-auto" />
        </div>
      </div>
    </footer>
  );
}
