import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void; locked: boolean };

const ThemeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "dashboard-theme";

/**
 * `forced` pins the surface for an area that has no theme choice (Admin and
 * Dashboard are light-only). Stored preference is ignored and never written.
 */
export function ThemeProvider({ children, forced }: { children: ReactNode; forced?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(forced ?? "dark");

  // Load persisted preference on mount (client-only)
  useEffect(() => {
    if (forced) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === "light" || saved === "dark") setThemeState(saved);
    } catch {}
  }, [forced]);

  const active = forced ?? theme;

  // Apply class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (active === "light") root.classList.add("light");
    else root.classList.remove("light");
    return () => {
      root.classList.remove("light");
    };
  }, [active]);

  const setTheme = (t: Theme) => {
    if (forced) return;
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: active,
        setTheme,
        locked: !!forced,
        toggle: () => setTheme(active === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
