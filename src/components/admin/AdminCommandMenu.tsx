import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ADMIN_GROUPS, ADMIN_GROUP_META, ADMIN_NAV_FLAT } from "@/lib/admin-nav";
import { Search, ExternalLink, EyeOff, LogOut, Settings } from "lucide-react";

const RECENTS_KEY = "sl.admin.recent-pages";

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function AdminCommandMenu() {
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>(() => readRecents());
  const navigate = useNavigate();
  const { isSuperAdmin, signOut, isImpersonating, stopImpersonation } = useAuth();

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

  const items = ADMIN_NAV_FLAT.filter((n) => !n.super || isSuperAdmin);

  const pushRecent = (to: string) => {
    const next = [to, ...recents.filter((r) => r !== to)].slice(0, 5);
    setRecents(next);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const go = (to: string, external?: boolean) => {
    setOpen(false);
    if (external) {
      window.open(to, "_blank");
    } else {
      pushRecent(to);
      navigate(to);
    }
  };

  const recentItems = recents
    .map((to) => items.find((i) => i.to === to && !i.external))
    .filter(Boolean) as typeof items;

  const renderItem = (item: (typeof items)[number], keyPrefix: string) => {
    const Icon = item.icon;
    return (
      <CommandItem
        key={`${keyPrefix}-${item.to}`}
        value={`${item.group} ${item.label} ${item.description ?? ""} ${(item.keywords ?? []).join(" ")}`}
        onSelect={() => go(item.to, item.external)}
      >
        <Icon className="mr-2 h-4 w-4 shrink-0" />
        <span>{item.label}</span>
        {item.description && (
          <span className="ml-2 truncate text-xs text-muted-foreground">{item.description}</span>
        )}
      </CommandItem>
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-2 px-2 text-xs text-muted-foreground sm:w-64 sm:justify-start sm:px-3"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search or jump to…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, people tools, settings…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>

          {recentItems.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentItems.map((item) => renderItem(item, "recent"))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {ADMIN_GROUPS.map((group) => {
            const gItems = items.filter((i) => i.group === group && !i.external);
            if (gItems.length === 0) return null;
            return (
              <CommandGroup key={group} heading={ADMIN_GROUP_META[group].label}>
                {gItems.map((item) => renderItem(item, group))}
              </CommandGroup>
            );
          })}

          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              value="site settings landing only mode toggle"
              onSelect={() => go("/admin/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Site settings & landing-only mode
            </CommandItem>
            <CommandItem value="open public site new tab" onSelect={() => go("/", true)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open public site in new tab
            </CommandItem>
            {isSuperAdmin && !isImpersonating && (
              <CommandItem
                value="view as a user impersonate sign in as act as open user dashboard"
                onSelect={() => go("/admin/users")}
              >
                <Eye className="mr-2 h-4 w-4" />
                View as a user…
              </CommandItem>
            )}
            {isImpersonating && (
              <CommandItem
                value="exit impersonation stop viewing as"
                onSelect={() => {
                  setOpen(false);
                  stopImpersonation();
                }}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Exit impersonation
              </CommandItem>
            )}
            <CommandItem
              value="sign out log out"
              onSelect={() => {
                setOpen(false);
                signOut();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
