import logoUrl from "@/assets/startuplabs-logo.svg";
import evolveLogoUrl from "@/assets/evolve-logo.svg";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-8 md:py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Startuplabs" className="h-9 w-auto md:h-10" />
          <span>· Norcross, GA</span>
        </div>
        <div>© {new Date().getFullYear()} · One day. One business.</div>
        <div className="flex items-center gap-2">
          <span>A division of</span>
          <img src={evolveLogoUrl} alt="Evolve Inc." className="h-7 w-auto md:h-8" />
        </div>
      </div>
    </footer>
  );
}
