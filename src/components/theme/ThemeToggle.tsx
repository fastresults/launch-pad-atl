import { Moon, Sun } from "lucide-react";
import { ClientOnly } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

function ToggleInner() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function ThemeToggle() {
  return (
    <ClientOnly fallback={<div className="size-9" aria-hidden />}>
      <ToggleInner />
    </ClientOnly>
  );
}
