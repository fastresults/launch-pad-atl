// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Scale,
  Sparkles,
  FileText,
  MessageCircleQuestion,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichMarkdown } from "@/components/markdown/RichMarkdown";
import { buildLegalSteps, recommendEntity, type LegalStep } from "@/lib/legal-setup";
import { STATE_JURISDICTIONS, POPULAR_STATES, getStateByCode } from "@/lib/legal-setup-states";
import {
  generateOperatingAgreement,
  getMyLegalSetup,
  toggleLegalStep,
  upsertMyLegalSetup,
  type LegalSetupProgress,
} from "@/lib/legal-setup.functions";
import { getMyFiling } from "@/lib/filing.functions";

export default function LegalSetupPage() {
  const qc = useQueryClient();
  const { data: progress } = useQuery({ queryKey: ["my", "legal-setup"], queryFn: getMyLegalSetup });
  const { data: filing } = useQuery({ queryKey: ["my", "filing"], queryFn: getMyFiling });
  const { data: brief } = useQuery({ queryKey: ["my", "brief-location"], queryFn: getMyBriefLocation });

  // GLOBAL RULE: the venture brief decides the state unless the founder overrides it here.
  const resolvedState = useMemo(
    () =>
      resolveEntityState({
        savedState: progress?.entity_state,
        savedSource: progress?.entity_state_source,
        briefRegion: brief?.region,
        briefCity: brief?.city,
        filingState: filing?.state,
      }),
    [progress?.entity_state, progress?.entity_state_source, brief?.region, brief?.city, filing?.state],
  );
  const stateCode = resolvedState.code;
  const state = useMemo(() => getStateByCode(stateCode), [stateCode]);
  const steps = useMemo(() => buildLegalSteps(state), [state]);

  const completed = progress?.steps_completed ?? {};
  const doneCount = steps.filter((s) => completed[s.key]).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  const toggle = useMutation({
    mutationFn: (v: { key: string; done: boolean }) => toggleLegalStep(v.key, v.done),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my", "legal-setup"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const saveState = useMutation({
    mutationFn: (code: string) =>
      upsertMyLegalSetup({ entity_state: code, entity_state_source: "user" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my", "legal-setup"] });
      toast.success("State updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const popular = STATE_JURISDICTIONS.filter((s) => POPULAR_STATES.includes(s.code)).sort(
    (a, b) => POPULAR_STATES.indexOf(a.code) - POPULAR_STATES.indexOf(b.code),
  );
  const rest = STATE_JURISDICTIONS.filter((s) => !POPULAR_STATES.includes(s.code)).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard/workflow">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to workflow
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-semibold tracking-tight">Legal Setup — {state.name}</h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              A concierge walkthrough for forming your startup in {state.name} and getting your Federal EIN. Every step tells you what to click, what it costs, and how long it takes. Mark each one complete as you go.
            </p>
          </div>
          <div className="min-w-[220px]">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {doneCount} / {steps.length}
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <MapPin className="h-5 w-5 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Form your startup in</div>
            <div className="text-xs text-muted-foreground">
              {state.filingAgency} · {state.filingAgencyAddress}
            </div>
          </div>
          <div className="min-w-[260px]">
            <Select value={stateCode} onValueChange={(v) => saveState.mutate(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[420px]">
                <SelectGroup>
                  <SelectLabel>Popular for holding companies</SelectLabel>
                  {popular.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>All states</SelectLabel>
                  {rest.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        {state.notes && (
          <p className="mt-3 rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Heads up ({state.name}):</strong> {state.notes}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-card/50 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Not legal advice.</strong> This is a step-by-step
        guide for the standard {state.name} LLC formation and IRS EIN application. For unusual
        situations — foreign founders, multiple entity structures, professional-license
        industries — talk to a {state.name} business attorney before you file.
      </div>

      <Accordion type="multiple" defaultValue={["step-1"]} className="space-y-3">
        {steps.map((step) => (
          <StepBlock
            key={step.key}
            step={step}
            state={state}
            done={!!completed[step.key]}
            progress={progress ?? null}
            filing={filing ?? {}}
            onToggle={(v) => toggle.mutate({ key: step.key, done: v })}
          />
        ))}
      </Accordion>
    </div>
  );
}

function StepBlock({
  step,
  state,
  done,
  progress,
  filing,
  onToggle,
}: {
  step: LegalStep;
  state: ReturnType<typeof getStateByCode>;
  done: boolean;
  progress: LegalSetupProgress | null;
  filing: Record<string, any>;
  onToggle: (v: boolean) => void;
}) {
  return (
    <AccordionItem
      value={`step-${step.n}`}
      className={`rounded-2xl border ${done ? "border-status-success/40 bg-status-success/5" : "border-white/10 bg-card"} px-4`}
    >
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex flex-1 items-center gap-3 pr-2 text-left">
          <div
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border text-sm font-semibold ${
              done
                ? "border-status-success/50 bg-status-success/10 text-status-success"
                : "border-primary/40 bg-primary/5 text-primary"
            }`}
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : step.n}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{step.label}</h3>
              <span className="text-xs text-muted-foreground">· ~{step.estMinutes} min · {step.cost}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{step.short}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-5 pt-1">
        <div className="space-y-4 text-sm">
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{step.detail}</p>

          <StepInputs step={step} state={state} progress={progress} filing={filing} />


          <div className="flex flex-wrap gap-2">
            {step.officialLinks.map((l) => (
              <Button key={l.url} asChild size="sm" variant="outline">
                <a href={l.url} target="_blank" rel="noreferrer noopener">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" /> {l.label}
                </a>
              </Button>
            ))}
          </div>

          <Separator className="opacity-40" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={done} onCheckedChange={(v) => onToggle(!!v)} />
              <span className="font-medium">
                {done ? "Step complete" : "Mark this step complete"}
              </span>
            </label>
            <StuckHelpButton step={step} />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function StepInputs({
  step,
  state,
  progress,
  filing,
}: {
  step: LegalStep;
  state: ReturnType<typeof getStateByCode>;
  progress: LegalSetupProgress | null;
  filing: Record<string, any>;
}) {
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (patch: Partial<LegalSetupProgress>) => upsertMyLegalSetup(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my", "legal-setup"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  if (step.key === "entity_choice")
    return <EntityChoicePanel state={state} progress={progress} onSave={(p) => save.mutate(p)} />;
  if (step.key === "name_check")
    return (
      <NameCheckPanel
        state={state}
        progress={progress}
        defaultName={filing?.llc_name || ""}
        onSave={(p) => save.mutate(p)}
      />
    );
  if (step.key === "registered_agent")
    return (
      <RegisteredAgentPanel
        state={state}
        progress={progress}
        defaultAgent={filing?.registered_agent_name || ""}
        onSave={(p) => save.mutate(p)}
      />
    );
  if (step.key === "articles_filed")
    return <ArticlesPanel state={state} progress={progress} filing={filing} onSave={(p) => save.mutate(p)} />;
  if (step.key === "ein") return <EinPanel state={state} progress={progress} onSave={(p) => save.mutate(p)} />;
  if (step.key === "operating_agreement")
    return <OperatingAgreementPanel state={state} progress={progress} onSave={(p) => save.mutate(p)} />;
  if (step.key === "post_formation") return <PostFormationPanel state={state} />;
  return null;
}

// ---------- Step panels ----------

function EntityChoicePanel({
  state,
  progress,
  onSave,
}: {
  state: ReturnType<typeof getStateByCode>;
  progress: LegalSetupProgress | null;
  onSave: (p: Partial<LegalSetupProgress>) => void;
}) {
  const [choice, setChoice] = useState<string>(progress?.entity_choice ?? "llc");
  useEffect(() => {
    if (progress?.entity_choice) setChoice(progress.entity_choice);
  }, [progress?.entity_choice]);
  const rec = recommendEntity({ hasCofounders: false, stateCode: state.code });
  return (
    <div className="rounded-xl border border-white/10 bg-background/40 p-4">
      <div className="mb-2 flex items-start gap-2 text-xs">
        <Sparkles className="h-3.5 w-3.5 flex-none text-primary mt-0.5" />
        <span className="font-medium">Our recommendation:</span>
        <span className="text-muted-foreground">{rec.reason}</span>
      </div>
      <RadioGroup
        value={choice}
        onValueChange={(v) => {
          setChoice(v);
          onSave({ entity_choice: v });
        }}
        className="grid gap-2 sm:grid-cols-3"
      >
        {[
          { v: "llc", label: "LLC", sub: "Recommended" },
          { v: "s_corp", label: "S-Corp", sub: "Payroll from day one" },
          { v: "sole_prop", label: "Sole Prop", sub: "Testing only" },
        ].map((opt) => (
          <label
            key={opt.v}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
              choice === opt.v ? "border-primary bg-primary/5" : "border-white/10"
            }`}
          >
            <RadioGroupItem value={opt.v} className="mt-0.5" />
            <div>
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.sub}</div>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function NameCheckPanel({
  state,
  progress,
  defaultName,
  onSave,
}: {
  state: ReturnType<typeof getStateByCode>;
  progress: LegalSetupProgress | null;
  defaultName: string;
  onSave: (p: Partial<LegalSetupProgress>) => void;
}) {
  const [name, setName] = useState(progress?.business_name || defaultName || "");
  const [reserved, setReserved] = useState(progress?.name_reserved ?? false);
  useEffect(() => {
    setName(progress?.business_name || defaultName || "");
    setReserved(progress?.name_reserved ?? false);
  }, [progress?.business_name, progress?.name_reserved, defaultName]);
  const reservationCopy = state.nameReservationFeeUsd
    ? `I reserved this name ($${state.nameReservationFeeUsd}, optional)`
    : `${state.name} does not offer name reservation`;
  return (
    <div className="grid gap-3 rounded-xl border border-white/10 bg-background/40 p-4 sm:grid-cols-2">
      <div>
        <Label className="text-xs">Proposed LLC name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onSave({ business_name: name || null })}
          placeholder={`e.g. Acme ${state.name} LLC`}
        />
        <div className="mt-2">
          <Button asChild size="sm" variant="secondary">
            <a href={state.nameSearchUrl} target="_blank" rel="noreferrer noopener">
              Search on {state.filingAgency.split(",")[0]} <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
      <label className={`mt-6 flex items-start gap-2 text-sm ${state.nameReservationFeeUsd ? "cursor-pointer" : "opacity-60"}`}>
        <Checkbox
          disabled={!state.nameReservationFeeUsd}
          checked={reserved}
          onCheckedChange={(v) => {
            const next = !!v;
            setReserved(next);
            onSave({ name_reserved: next });
          }}
        />
        <div>
          <div className="font-medium">{reservationCopy}</div>
          <div className="text-xs text-muted-foreground">
            {state.nameReservationFeeUsd
              ? `Only needed if you're not filing within ${state.nameReservationDays ?? 30} days.`
              : "Skip this step and go straight to filing your Articles."}
          </div>
        </div>
      </label>
    </div>
  );
}

function RegisteredAgentPanel({
  state,
  progress,
  defaultAgent,
  onSave,
}: {
  state: ReturnType<typeof getStateByCode>;
  progress: LegalSetupProgress | null;
  defaultAgent: string;
  onSave: (p: Partial<LegalSetupProgress>) => void;
}) {
  const [choice, setChoice] = useState(progress?.registered_agent_choice || "self");
  const [name, setName] = useState(progress?.registered_agent_name || defaultAgent || "");
  const [service, setService] = useState(progress?.registered_agent_service || "");
  useEffect(() => {
    setChoice(progress?.registered_agent_choice || "self");
    setName(progress?.registered_agent_name || defaultAgent || "");
    setService(progress?.registered_agent_service || "");
  }, [progress?.registered_agent_choice, progress?.registered_agent_name, progress?.registered_agent_service, defaultAgent]);
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-4">
      <p className="text-xs text-muted-foreground">{state.registeredAgentRules}</p>
      <RadioGroup
        value={choice}
        onValueChange={(v) => {
          setChoice(v);
          onSave({ registered_agent_choice: v });
        }}
        className="grid gap-2 sm:grid-cols-3"
      >
        {[
          { v: "self", label: "I'll be my own agent", sub: `Free, public ${state.code} address` },
          { v: "cofounder", label: "Cofounder / friend", sub: `Must live in ${state.name}` },
          { v: "service", label: "Use a service", sub: "$99–$150/year, private" },
        ].map((opt) => (
          <label
            key={opt.v}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
              choice === opt.v ? "border-primary bg-primary/5" : "border-white/10"
            }`}
          >
            <RadioGroupItem value={opt.v} className="mt-0.5" />
            <div>
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.sub}</div>
            </div>
          </label>
        ))}
      </RadioGroup>
      {choice !== "service" ? (
        <div>
          <Label className="text-xs">Agent's full name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onSave({ registered_agent_name: name || null })}
            placeholder="First Last"
          />
        </div>
      ) : (
        <div>
          <Label className="text-xs">Service provider</Label>
          <Input
            value={service}
            onChange={(e) => setService(e.target.value)}
            onBlur={() => onSave({ registered_agent_service: service || null })}
            placeholder="Northwest Registered Agent"
          />
        </div>
      )}
    </div>
  );
}

function ArticlesPanel({
  state,
  progress,
  filing,
  onSave,
}: {
  state: ReturnType<typeof getStateByCode>;
  progress: LegalSetupProgress | null;
  filing: Record<string, any>;
  onSave: (p: Partial<LegalSetupProgress>) => void;
}) {
  const [ctl, setCtl] = useState(progress?.articles_control_number || "");
  const [filedDate, setFiledDate] = useState<string>(
    progress?.articles_filed_at ? progress.articles_filed_at.slice(0, 10) : "",
  );
  useEffect(() => {
    setCtl(progress?.articles_control_number || "");
    setFiledDate(progress?.articles_filed_at ? progress.articles_filed_at.slice(0, 10) : "");
  }, [progress?.articles_control_number, progress?.articles_filed_at]);
  const crib = [
    ["Entity name", progress?.business_name || filing?.llc_name || "—"],
    ["Registered Agent name", progress?.registered_agent_name || filing?.registered_agent_name || "—"],
    ["Registered Agent address", filing?.registered_agent_address || `${filing?.address_line1 ?? ""} ${filing?.city ?? ""}, ${state.code} ${filing?.postal_code ?? ""}` || "—"],
    ["Principal office", `${filing?.address_line1 ?? ""} ${filing?.city ?? ""}, ${state.code} ${filing?.postal_code ?? ""}`],
    ["Organizer", `${filing?.legal_first_name ?? ""} ${filing?.legal_last_name ?? ""}`.trim() || "—"],
    ["File with", `${state.filingAgency} · ${state.filingAgencyAddress}${state.filingAgencyPhone ? ` · ${state.filingAgencyPhone}` : ""}`],
  ];
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Field-by-field crib sheet (from your Filing Info)
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {crib.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-background/60 px-3 py-2 text-xs">
            <div className="text-muted-foreground">{k}</div>
            <div className="mt-0.5 font-medium">{v || "—"}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Missing something?{" "}
        <Link to="/dashboard/filing" className="underline">
          Update your Filing Info
        </Link>{" "}
        and the values here will refresh.
      </p>
      <Separator className="opacity-40" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Control / entity number (once approved)</Label>
          <Input
            value={ctl}
            onChange={(e) => setCtl(e.target.value)}
            onBlur={() => onSave({ articles_control_number: ctl || null })}
            placeholder="e.g. 23456789"
          />
        </div>
        <div>
          <Label className="text-xs">Date filed</Label>
          <Input
            type="date"
            value={filedDate}
            onChange={(e) => {
              setFiledDate(e.target.value);
              onSave({ articles_filed_at: e.target.value ? new Date(e.target.value).toISOString() : null });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function EinPanel({
  state,
  progress,
  onSave,
}: {
  state: ReturnType<typeof getStateByCode>;
  progress: LegalSetupProgress | null;
  onSave: (p: Partial<LegalSetupProgress>) => void;
}) {
  const [ein, setEin] = useState(progress?.ein || "");
  useEffect(() => setEin(progress?.ein || ""), [progress?.ein]);
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-4">
      <ol className="ml-4 list-decimal space-y-1 text-xs text-muted-foreground">
        <li>Open the IRS EIN online application (Mon–Fri, 7am–10pm ET).</li>
        <li>Legal structure → <strong>Limited Liability Company</strong> → number of members → state <strong>{state.name}</strong>.</li>
        <li>Reason for applying → <strong>Started a new business</strong>.</li>
        <li>Responsible party → your legal name + SSN or ITIN.</li>
        <li><strong>Download the CP 575 PDF at the end.</strong> The IRS will not email it.</li>
      </ol>
      <div>
        <Label className="text-xs">Your EIN (format: XX-XXXXXXX)</Label>
        <Input
          value={ein}
          onChange={(e) => setEin(e.target.value)}
          onBlur={() =>
            onSave({
              ein: ein || null,
              ein_obtained_at: ein ? new Date().toISOString() : null,
            })
          }
          placeholder="12-3456789"
        />
      </div>
    </div>
  );
}

function OperatingAgreementPanel({
  state,
  progress,
  onSave,
}: {
  state: ReturnType<typeof getStateByCode>;
  progress: LegalSetupProgress | null;
  onSave: (p: Partial<LegalSetupProgress>) => void;
}) {
  const qc = useQueryClient();
  const gen = useMutation({
    mutationFn: () => generateOperatingAgreement(),
    onSuccess: (r) => {
      onSave({
        operating_agreement_markdown: r.markdown,
        operating_agreement_generated_at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["my", "legal-setup"] });
      toast.success("Operating Agreement ready");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });
  const md = progress?.operating_agreement_markdown;
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-4">
      <Button onClick={() => gen.mutate()} disabled={gen.isPending} size="sm">
        {gen.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting…
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" /> {md ? "Regenerate draft" : `Generate my ${state.name} Operating Agreement`}
          </>
        )}
      </Button>
      {md && (
        <div className="max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-background/60 p-4">
          <RichMarkdown>{md}</RichMarkdown>
        </div>
      )}
      {md && (
        <p className="text-xs text-muted-foreground">
          This is a starting draft citing {state.llcActCitation}. If you have cofounders or outside investors, have a {state.name} business attorney review it before you sign.
        </p>
      )}
    </div>
  );
}

function PostFormationPanel({ state }: { state: ReturnType<typeof getStateByCode> }) {
  if (!state.annualReport.required) {
    return (
      <div className="rounded-xl border border-white/10 bg-background/40 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">{state.name}</strong> does not require an annual
        report for LLCs. Confirm on the {state.filingAgency} site and keep an eye on any
        franchise or business-privilege tax that may still apply.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-background/40 p-4 text-xs text-muted-foreground">
      File your <strong className="text-foreground">{state.name} {state.annualReport.label}</strong> —
      {" "}${state.annualReport.feeUsd}, {state.annualReport.dueRule}. Skip it and the state may
      administratively dissolve your LLC. Filing portal:{" "}
      <a href={state.annualReport.filingUrl} target="_blank" rel="noreferrer noopener" className="underline">
        {state.annualReport.filingUrl}
      </a>
    </div>
  );
}

function StuckHelpButton({ step }: { step: LegalStep }) {
  const openConcierge = () => {
    try {
      window.dispatchEvent(
        new CustomEvent("concierge:open", {
          detail: { prompt: `I'm stuck on the "${step.label}" step for forming my LLC. ${step.short}` },
        }),
      );
    } catch {}
  };
  return (
    <Button variant="ghost" size="sm" onClick={openConcierge}>
      <MessageCircleQuestion className="mr-1 h-4 w-4" /> What if I'm stuck?
    </Button>
  );
}

