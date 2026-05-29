## Light / dark toggle for the authenticated area

Today `src/styles.css` defines one set of dark tokens on `:root` with no `.dark` variant, so the app is dark-only. Tailwind v4 is already set up for a `.dark` variant (`@custom-variant dark (&:is(.dark *))`), so the structure is in place — we just need a light token set, a theme controller, and a toggle.

### Scope

- Toggle is **only** active in the authenticated portal: `/_authenticated/dashboard/*` and `/_authenticated/_admin/*` (anything behind login).
- Public marketing routes (`/`, `/register`, `/login`, `/signup`, etc.) stay locked to the current dark look — they're designed for it.

### 1. Token set in `src/styles.css`

- Keep current tokens, but move the **dark values** into `.dark { ... }`.
- Add a parallel **light** palette on `:root`: white-ish background, dark foreground, the same blue primary, lighter borders/muted, same brand gradient stops (gradients work in both themes).
- Keep the brand gradient variables outside the light/dark split (shared).

### 2. Theme controller (`src/components/theme/ThemeProvider.tsx`)

Small client-only provider, no extra dependency:
- React context exposing `theme: "light" | "dark"` and `setTheme`.
- Reads initial value from `localStorage` key `dashboard-theme` (fallback `"dark"` to preserve today's look; no system-preference auto-detect to keep behavior predictable).
- Applies/removes the `dark` class on `document.documentElement` inside a `useEffect`, so SSR stays stable (no hydration mismatch).
- Persists changes to `localStorage`.
- On unmount (i.e., when leaving the authenticated area) it removes the `dark` class — public pages keep their inline dark styling via tokens, unaffected.

### 3. `ThemeToggle` button (`src/components/theme/ThemeToggle.tsx`)

- shadcn `Button variant="ghost" size="icon"`.
- Renders `Sun` (in dark mode) / `Moon` (in light mode) from `lucide-react`.
- `onClick` flips the theme. `aria-label="Toggle theme"`.
- Wrapped in `<ClientOnly fallback={…16px placeholder…}>` so the icon doesn't cause hydration mismatch.

### 4. Wire-up

- Wrap the inside of `DashboardLayout` (`src/routes/_authenticated/dashboard.tsx`) with `<ThemeProvider>`.
- Wrap the inside of the admin layout (`src/routes/_authenticated/_admin.tsx`, or whichever file owns the admin shell) with the same `<ThemeProvider>`.
- Place `<ThemeToggle />` in each header — in the dashboard header next to the "Sign out" button (both the mobile and desktop right-side blocks), and in the admin shell header in the same position.

### Out of scope

- No changes to public/marketing routes or their styling.
- No system-preference detection or transitions — explicit user toggle only.
- No per-account persistence; preference is local to the browser.
