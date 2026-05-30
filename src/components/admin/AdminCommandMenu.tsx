import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_GROUPS, ADMIN_NAV } from "@/lib/admin-nav";
import { Search } from "lucide-react";

export function AdminCommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const items = ADMIN_NAV.filter((n) => !n.super || isSuperAdmin);

  const go = (to: string, external?: boolean) => {
    setOpen(false);
    if (external) {
      window.open(to, "_blank");
    } else {
      navigate({ to });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-2 px-2 text-xs text-muted-foreground sm:px-3"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-2 hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a page or run a command…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>

          {ADMIN_GROUPS.map((group) => {
            const gItems = items.filter((i) => i.group === group && !i.external);
            if (gItems.length === 0) return null;
            return (
              <CommandGroup key={group} heading={group}>
                {gItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.to}
                      value={`${group} ${item.label}`}
                      onSelect={() => go(item.to)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}

          <CommandSeparator />
          <CommandGroup heading="Quick actions">
            <CommandItem value="toggle homepage variant site settings" onSelect={() => go("/admin/site")}>
              Toggle homepage variant
            </CommandItem>
            <CommandItem value="create new cohort" onSelect={() => go("/admin/cohorts")}>
              Manage cohorts
            </CommandItem>
            <CommandItem value="view public site" onSelect={() => go("/", true)}>
              Open public site in new tab
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
