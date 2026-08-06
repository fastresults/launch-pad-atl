// Searchable, AI-assisted industry picker built on the SIC catalog.
// - Type to search 4-digit SIC codes by number, title, division or plain-language alias.
// - "Find my SIC code with AI" classifies a free-text description against the catalog.
// - Free text is still accepted so novices can describe the business their way.

import { useCallback, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Sparkles } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SIC_CODES,
  findSicByCode,
  parseSicCode,
  searchSic,
  sicValue,
  type SicEntry,
} from "@/lib/sic-codes";

interface IndustryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Extra context (business concept, company name) fed to the AI lookup. */
  context?: string;
}

type AiMatch = SicEntry & { why?: string };

export function IndustryCombobox({
  value,
  onChange,
  placeholder = "Search SIC codes or describe the business…",
  context,
}: IndustryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMatches, setAiMatches] = useState<AiMatch[]>([]);

  const results = useMemo(() => searchSic(query, 40), [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, SicEntry[]>();
    for (const r of results) {
      if (!map.has(r.division)) map.set(r.division, []);
      map.get(r.division)!.push(r);
    }
    return Array.from(map.entries());
  }, [results]);

  const selectedCode = parseSicCode(value);
  const selectedEntry = selectedCode ? findSicByCode(selectedCode) : undefined;
  const isCustom = !!value && !selectedEntry;
  const displayLabel = selectedEntry
    ? `SIC ${selectedEntry.code} — ${selectedEntry.title}`
    : value;

  const pick = useCallback(
    (entry: SicEntry) => {
      onChange(sicValue(entry));
      setOpen(false);
    },
    [onChange],
  );

  const runAi = useCallback(async () => {
    const description = [query.trim(), context?.trim()].filter(Boolean).join(" — ");
    if (description.length < 8) {
      toast.error("Type a few words about the business first.");
      return;
    }
    setAiLoading(true);
    setAiMatches([]);
    try {
      // Send a shortlist when the query already narrows things down, otherwise
      // the whole catalog so the model can range freely.
      const shortlist = searchSic(query, 60);
      const candidates = (shortlist.length >= 8 ? shortlist : SIC_CODES).map((c) => ({
        code: c.code,
        title: c.title,
        division: c.division,
      }));
      const { data, error } = await supabase.functions.invoke("sic-classify", {
        body: { description, candidates },
      });
      if (error) throw error;
      const matches: AiMatch[] = (data?.matches ?? [])
        .map((m: { code: string; why?: string }) => {
          const entry = findSicByCode(m.code);
          return entry ? { ...entry, why: m.why } : null;
        })
        .filter(Boolean);
      if (!matches.length) {
        toast.error("No SIC match found — try describing what you sell.");
      }
      setAiMatches(matches);
    } catch (e) {
      console.error("sic-classify", e);
      toast.error("AI lookup failed. Search by keyword instead.");
    } finally {
      setAiLoading(false);
    }
  }, [query, context]);

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
      <PopoverContent className="w-[min(32rem,92vw)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by code, industry, or what you actually do"
            value={query}
            onValueChange={setQuery}
          />

          <div className="flex items-center gap-2 border-b px-2 py-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 gap-1.5 text-xs"
              disabled={aiLoading}
              onClick={runAi}
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {aiLoading ? "Matching…" : "Find my SIC code with AI"}
            </Button>
            <span className="truncate text-[0.7rem] text-muted-foreground">
              Describe the business — AI picks the code.
            </span>
          </div>

          <CommandList className="max-h-[22rem]">
            {aiMatches.length > 0 && (
              <CommandGroup heading="AI matches">
                {aiMatches.map((m) => (
                  <CommandItem
                    key={`ai-${m.code}`}
                    value={`ai-${m.code}`}
                    onSelect={() => pick(m)}
                    className="items-start"
                  >
                    <Check
                      className={cn(
                        "mr-2 mt-0.5 h-4 w-4",
                        selectedCode === m.code ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        <span className="font-mono text-xs text-muted-foreground">{m.code}</span>{" "}
                        {m.title}
                      </span>
                      {m.why && (
                        <span className="block truncate text-xs text-muted-foreground">{m.why}</span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandEmpty>
              {query.trim() ? (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onChange(query.trim());
                    setOpen(false);
                  }}
                >
                  Use <span className="font-medium">"{query.trim()}"</span> as your industry
                </button>
              ) : (
                <span className="block px-3 py-2 text-sm text-muted-foreground">No matches</span>
              )}
            </CommandEmpty>

            {grouped.map(([division, items]) => (
              <CommandGroup key={division} heading={division}>
                {items.map((item) => (
                  <CommandItem
                    key={item.code}
                    value={item.code}
                    onSelect={() => pick(item)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCode === item.code ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">
                      <span className="font-mono text-xs text-muted-foreground">{item.code}</span>{" "}
                      {item.title}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {query.trim() &&
              !results.some((r) => r.title.toLowerCase() === query.trim().toLowerCase()) && (
                <CommandGroup heading="Custom">
                  <CommandItem
                    value={`__custom__${query}`}
                    onSelect={() => {
                      onChange(query.trim());
                      setOpen(false);
                    }}
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
