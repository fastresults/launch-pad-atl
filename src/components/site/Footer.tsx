import logoUrl from "@/assets/startuplabs-logo.svg";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="StartupLabs" className="h-10 w-auto" />
          <span>· Norcross, GA</span>
        </div>
        <div>© {new Date().getFullYear()} · One day. One business.</div>
      </div>
    </footer>
  );
}
