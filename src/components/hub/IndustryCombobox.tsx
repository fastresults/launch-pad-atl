// Searchable industry picker with free-text fallback.
// Uses shadcn Command + Popover for the lookup; falls back to the user's typed
// query if no match (so novices can describe their business freely).

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { INDUSTRIES, searchIndustries, type Industry } from "@/lib/industries";

interface IndustryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function IndustryCombobox({ value, onChange, placeholder = "Search industries…" }: IndustryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchIndustries(query, 40), [query]);

  // Group by `group` for display
  const grouped = useMemo(() => {
    const map = new Map<string, Industry[]>();
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return Array.from(map.entries());
  }, [results]);

  const isCustom = value && !INDUSTRIES.some((i) => i.value === value);
  const displayLabel = value
    ? (INDUSTRIES.find((i) => i.value === value)?.label ?? value)
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {displayLabel || placeholder}
            {isCustom && <span className="ml-1 text-xs text-muted-foreground">(custom)</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(28rem,90vw)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search — or describe in your own words"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim() ? (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => { onChange(query.trim()); setOpen(false); }}
                >
                  Use <span className="font-medium">"{query.trim()}"</span> as your industry
                </button>
              ) : (
                <span className="block px-3 py-2 text-sm text-muted-foreground">No matches</span>
              )}
            </CommandEmpty>
            {grouped.map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => { onChange(item.value); setOpen(false); }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {query.trim() && !results.some((r) => r.label.toLowerCase() === query.trim().toLowerCase()) && (
              <CommandGroup heading="Custom">
                <CommandItem
                  value={`__custom__${query}`}
                  onSelect={() => { onChange(query.trim()); setOpen(false); }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Use "<span className="font-medium">{query.trim()}</span>"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
