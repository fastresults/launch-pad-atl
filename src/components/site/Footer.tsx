import { Link } from "@tanstack/react-router";
import { StartupLabsLogo } from "@/components/brand/StartupLabsLogo";
import evolveLogoUrl from "@/assets/evolve-logo.svg";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-8 md:py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
        <div className="flex items-center gap-3">
          <StartupLabsLogo className="h-9 w-auto md:h-10 text-foreground" />
          <span>· Norcross, GA</span>
        </div>
        <div className="flex flex-col items-center gap-1 md:flex-row md:gap-4">
          <span>© {new Date().getFullYear()} · One day. One business.</span>
          <Link
            to="/contact"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Contact
          </Link>
          <span>·</span>
          <Link
            to="/privacy"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Privacy Policy
          </Link>
          <span>·</span>
          <Link
            to="/terms"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Terms of Service
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span>A division of</span>
          <img src={evolveLogoUrl} alt="Evolve Inc." className="h-7 w-auto md:h-8" />
        </div>
      </div>
    </footer>
  );
}
