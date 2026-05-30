import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Sparkles } from "lucide-react";
import { getFounderMemory } from "@/lib/founderMemory.functions";
import { BRIEF_BLOCKS } from "@/lib/brief-blocks";

type Props = {
  pitch?: string | null;
  secondary?: { to: string; label: string };
  footnote?: string;
};

export function BriefCompleteCard({ pitch, secondary, footnote }: Props) {
  const memFn = useServerFn(getFounderMemory);
  const { data } = useQuery({
    queryKey: ["my", "founder-memory"],
    queryFn: () => memFn(),
    staleTime: 60_000,
  });

  const memByBlock = new Map<number, string>();
  for (const m of data?.memories ?? []) {
    if (m.source === "brief_block" && typeof m.block_n === "number" && m.summary) {
      memByBlock.set(m.block_n, m.summary as string);
    }
  }

  return (
    <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-10 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
        <Sparkles className="h-4 w-4" /> Your startup brief
      </div>
      <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
        You've told us everything we need.
      </h2>
      {pitch ? (
        <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
          We know your startup as: <span className="text-foreground italic">"{pitch}"</span>
        </p>
      ) : (
        <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
          Your AI assistant has the full picture and will use it to build every deliverable.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {BRIEF_BLOCKS.map((b) => {
          const summary = memByBlock.get(b.id);
          return (
            <li key={b.id} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium">{b.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {summary ?? `${b.fieldKeys.length} questions captured.`}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          to="/dashboard/brief"
          search={{ review: 1 } as never}
          className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 min-h-[44px]"
        >
          Review my answers
        </Link>
        {secondary && (
          <Link
            to={secondary.to as never}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {secondary.label}
          </Link>
        )}
      </div>

      {footnote && (
        <p className="mt-5 text-xs text-muted-foreground">{footnote}</p>
      )}
    </div>
  );
}
