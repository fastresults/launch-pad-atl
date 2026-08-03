import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Phone-only sticky action bar.
 * Rendered from SiteHeader so every public page gets it; CSS hides it
 * above 767px. Suppressed on pages that already are the conversion step.
 */
const HIDDEN_ON = ["/register", "/login", "/schedule"];

export function MobileCtaBar() {
  const { pathname } = useLocation();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="sl-mobile-cta" role="complementary" aria-label="Reserve a seat">
      <div className="sl-mobile-cta__copy">
        <span className="sl-mobile-cta__label">Next workshop</span>
        <span className="sl-mobile-cta__value">Aug 20 · Atlanta</span>
      </div>
      <Link to="/register" className="sl-mobile-cta__button bg-hero-gradient text-white">
        Reserve seat
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
