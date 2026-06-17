// @ts-nocheck
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import {
  getBrandPackage,
  generateBrandPackage,
  updateBrandPackage,
  approveBrandPackage,
  TONES,
  PLATFORM_BIO_LIMITS,
  type BrandPackage,
} from "@/lib/brand-intake.functions";
import { VIBES, COLOR_MOODS } from "@/lib/creative-vibes";

type Step = "intake" | "generating" | "review";

export default function AdminSocialSetupIntake() {
  const qc = useQueryClient();
  const pkgQ = useQuery({ queryKey: ["brand-package"], queryFn: getBrandPackage });
  const [step, setStep] = useState<Step>("intake");
  const [intake, setIntake] = useState({
    description: "",
    tone: "founder_personal",
    industry: "",
    founder_name: "",
    website: "",
  });

  // Auto-jump to review if a package already exists.
  useEffect(() => {
    if (pkgQ.data && step === "intake") setStep("review");
    if (pkgQ.data?.intake_input) {
      setIntake((prev) => ({
        ...prev,
        description: pkgQ.data!.intake_input.description ?? prev.description,
        tone: pkgQ.data!.intake_input.tone ?? prev.tone,
        industry: pkgQ.data!.intake_input.industry ?? prev.industry ?? "",
        founder_name: pkgQ.data!.intake_input.founder_name ?? prev.founder_name ?? "",
        website: pkgQ.data!.intake_input.website ?? prev.website ?? "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgQ.data?.user_id]);

  const generateMut = useMutation({
    mutationFn: () =>
      generateBrandPackage({
        description: intake.description.trim(),
        tone: intake.tone as any,
        industry: intake.industry.trim() || undefined,
        founder_name: intake.founder_name.trim() || undefined,
        website: intake.website.trim() || undefined,
      }),
    onMutate: () => setStep("generating"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-package"] });
      qc.invalidateQueries({ queryKey: ["social-setup", "brand"] });
      setStep("review");
      toast.success("Brand package ready — review and edit below");
    },
    onError: (e: any) => {
      setStep("intake");
      if (e?.code === "PAYMENT_REQUIRED") {
        toast.error("Out of AI credits. Add credits in Workspace → Usage.");
      } else if (e?.code === "RATE_LIMITED") {
        toast.error("Slow down — try again in a moment.");
      } else {
        toast.error(e.message ?? "Generation failed");
      }
    },
  });

  if (pkgQ.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI Brand Intake"
        description="Answer two short questions. Our AI drafts your display name, handles, every platform bio, visual direction, and a launch kit. You review and edit, then save."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/social/setup">
              <ArrowLeft className="mr-2 h-4 w-4" /> Setup wizard
            </Link>
          </Button>
        }
      />

      {step === "intake" && (
        <IntakeForm
          intake={intake}
          setIntake={setIntake}
          onSubmit={() => generateMut.mutate()}
          isPending={generateMut.isPending}
          hasExisting={!!pkgQ.data}
        />
      )}

      {step === "generating" && <Generating />}

      {step === "review" && pkgQ.data && (
        <ReviewScreen
          pkg={pkgQ.data}
          onRegenerate={() => setStep("intake")}
        />
      )}
    </div>
  );
}

function IntakeForm({
  intake,
  setIntake,
  onSubmit,
  isPending,
  hasExisting,
}: {
  intake: any;
  setIntake: (v: any) => void;
  onSubmit: () => void;
  isPending: boolean;
  hasExisting: boolean;
}) {
  const tooShort = intake.description.trim().length < 20;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tell us about your startup</CardTitle>
        <p className="text-sm text-muted-foreground">
          2–4 sentences is plenty. The more concrete, the better the draft.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label className="mb-1 block text-xs font-medium">What does your startup do? *</label>
          <Textarea
            rows={5}
            maxLength={1500}
            value={intake.description}
            onChange={(e) => setIntake({ ...intake, description: e.target.value })}
            placeholder="We help solo accountants automate client onboarding so they can take on 3× more clients without hiring. Our vibe is calm, precise, and a little nerdy."
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {intake.description.length}/1500 · minimum 20 characters
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium">Pick an audience tone *</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {TONES.map((t) => {
              const active = intake.tone === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setIntake({ ...intake, tone: t.value })}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-[11px] text-muted-foreground">{t.helper}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Industry (optional)</label>
            <Input
              value={intake.industry}
              onChange={(e) => setIntake({ ...intake, industry: e.target.value })}
              placeholder="Accounting SaaS"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Founder name (optional)</label>
            <Input
              value={intake.founder_name}
              onChange={(e) => setIntake({ ...intake, founder_name: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Website (optional)</label>
            <Input
              value={intake.website}
              onChange={(e) => setIntake({ ...intake, website: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {hasExisting && (
            <p className="mr-auto text-xs text-muted-foreground">
              This will replace your existing brand package.
            </p>
          )}
          <Button onClick={onSubmit} disabled={tooShort || isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isPending ? "Generating…" : "Generate Brand Package"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Generating() {
  return (
    <Card>
      <CardContent className="space-y-4 p-10 text-center">
        <Sparkles className="mx-auto h-8 w-8 animate-pulse text-primary" />
        <div className="text-sm font-medium">Drafting your brand package…</div>
        <p className="mx-auto max-w-md text-xs text-muted-foreground">
          We're writing your display name, handle ideas, bios for all 14 platforms, picking a vibe + colors,
          and drafting your launch kit. This usually takes 15–30 seconds.
        </p>
        <Progress value={66} className="mx-auto h-1.5 max-w-sm animate-pulse" />
      </CardContent>
    </Card>
  );
}

function ReviewScreen({ pkg, onRegenerate }: { pkg: BrandPackage; onRegenerate: () => void }) {
  const qc = useQueryClient();
  const [identity, setIdentity] = useState(pkg.identity ?? {});
  const [bios, setBios] = useState<Record<string, string>>(pkg.per_platform_bios ?? {});
  const [visual, setVisual] = useState(pkg.visual_direction ?? {});
  const [launch, setLaunch] = useState(pkg.launch_kit ?? {});

  useEffect(() => {
    setIdentity(pkg.identity ?? {});
    setBios(pkg.per_platform_bios ?? {});
    setVisual(pkg.visual_direction ?? {});
    setLaunch(pkg.launch_kit ?? {});
  }, [pkg.updated_at]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateBrandPackage({
        identity,
        per_platform_bios: bios,
        visual_direction: visual,
        launch_kit: launch,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-package"] });
      qc.invalidateQueries({ queryKey: ["social-setup", "brand"] });
      toast.success("Edits saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const approveMut = useMutation({
    mutationFn: async () => {
      // Save edits first, then approve.
      await updateBrandPackage({
        identity,
        per_platform_bios: bios,
        visual_direction: visual,
        launch_kit: launch,
      });
      await approveBrandPackage();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-package"] });
      qc.invalidateQueries({ queryKey: ["social-setup", "brand"] });
      qc.invalidateQueries({ queryKey: ["social-setup", "progress"] });
      toast.success("Brand package approved — Creative Studio unlocked");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isApproved = pkg.status === "approved";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={isApproved ? "secondary" : "outline"}>
              {isApproved ? "Approved" : "Draft"}
            </Badge>
            <span className="text-muted-foreground">
              Generated with {pkg.model_used ?? "AI"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onRegenerate}>
              <RefreshCw className="mr-2 h-4 w-4" /> Re-run intake
            </Button>
            <Button variant="outline" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saving…" : "Save edits"}
            </Button>
            <Button onClick={() => approveMut.mutate()} disabled={approveMut.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isApproved ? "Re-approve & continue" : "Approve & unlock Creative Studio"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader><CardTitle className="text-base">Identity</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Labelled label="Display name">
            <Input
              value={identity.display_name ?? ""}
              onChange={(e) => setIdentity({ ...identity, display_name: e.target.value })}
            />
          </Labelled>
          <Labelled label="Handle suggestions" hint="First one mirrors to your Brand Kit.">
            <div className="flex flex-wrap gap-1.5">
              {(identity.handle_suggestions ?? []).map((h: string, i: number) => (
                <a
                  key={`${h}-${i}`}
                  href={`https://namechk.com/${encodeURIComponent(h)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border bg-background px-2 py-1 text-xs hover:border-primary/50"
                >
                  @{h}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </Labelled>
          <Labelled label={`Short bio (${(identity.short_bio ?? "").length}/160)`} className="md:col-span-2">
            <Textarea
              rows={2}
              maxLength={160}
              value={identity.short_bio ?? ""}
              onChange={(e) => setIdentity({ ...identity, short_bio: e.target.value })}
            />
          </Labelled>
          <Labelled label={`Long bio (${(identity.long_bio ?? "").length} chars)`} className="md:col-span-2">
            <Textarea
              rows={5}
              value={identity.long_bio ?? ""}
              onChange={(e) => setIdentity({ ...identity, long_bio: e.target.value })}
            />
          </Labelled>
        </CardContent>
      </Card>

      {/* Per-platform bios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-platform bios</CardTitle>
          <p className="text-sm text-muted-foreground">
            Each one is tuned to the platform's culture and length limit. Edit inline.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {Object.keys(PLATFORM_BIO_LIMITS).map((p) => {
            const limit = PLATFORM_BIO_LIMITS[p];
            const v = bios[p] ?? "";
            const over = v.length > limit;
            return (
              <Labelled
                key={p}
                label={p.replace(/_/g, " ")}
                hint={`${v.length}/${limit}${over ? " — too long" : ""}`}
              >
                <Textarea
                  rows={Math.min(5, Math.max(2, Math.ceil(limit / 80)))}
                  value={v}
                  onChange={(e) => setBios({ ...bios, [p]: e.target.value })}
                  className={over ? "border-destructive" : undefined}
                />
              </Labelled>
            );
          })}
        </CardContent>
      </Card>

      {/* Visual direction */}
      <Card>
        <CardHeader><CardTitle className="text-base">Visual direction</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium">Vibe</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {VIBES.map((vi) => {
                const active = visual.vibe === vi.value;
                return (
                  <button
                    key={vi.value}
                    type="button"
                    onClick={() => setVisual({ ...visual, vibe: vi.value })}
                    className={`rounded-md border p-3 text-left text-xs transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium">{vi.label}</div>
                    <div className="mt-1 flex gap-1">
                      {vi.swatch.map((c) => (
                        <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium">Color mood</div>
            <div className="flex flex-wrap gap-2">
              {COLOR_MOODS.map((cm) => {
                const active = visual.color_mood === cm.value;
                return (
                  <button
                    key={cm.value}
                    type="button"
                    onClick={() => setVisual({ ...visual, color_mood: cm.value })}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex gap-1">
                      {cm.swatch.map((c) => (
                        <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    {cm.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Labelled label="Brand colors (3 hex)">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 shrink-0 rounded border"
                    style={{ background: (visual.brand_colors ?? [])[i] || "#fff" }}
                  />
                  <Input
                    value={(visual.brand_colors ?? [])[i] ?? ""}
                    onChange={(e) => {
                      const next = [...(visual.brand_colors ?? ["", "", ""])];
                      next[i] = e.target.value;
                      setVisual({ ...visual, brand_colors: next });
                    }}
                    placeholder="#000000"
                  />
                </div>
              ))}
            </div>
          </Labelled>
          <Labelled label="Logo prompt for Creative Studio">
            <Textarea
              rows={2}
              value={visual.logo_prompt ?? ""}
              onChange={(e) => setVisual({ ...visual, logo_prompt: e.target.value })}
            />
          </Labelled>
        </CardContent>
      </Card>

      {/* Launch kit */}
      <Card>
        <CardHeader><CardTitle className="text-base">Launch kit</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Labelled label="Pinned post — short (X / Threads / Bluesky)" className="md:col-span-2">
            <Textarea
              rows={3}
              value={launch.pinned_post_short ?? ""}
              onChange={(e) => setLaunch({ ...launch, pinned_post_short: e.target.value })}
            />
          </Labelled>
          <Labelled label="Pinned post — long (LinkedIn / Facebook)" className="md:col-span-2">
            <Textarea
              rows={6}
              value={launch.pinned_post_long ?? ""}
              onChange={(e) => setLaunch({ ...launch, pinned_post_long: e.target.value })}
            />
          </Labelled>
          <Labelled label="Link-in-bio one-liner">
            <Input
              value={launch.link_in_bio ?? ""}
              onChange={(e) => setLaunch({ ...launch, link_in_bio: e.target.value })}
            />
          </Labelled>
          <Labelled label="Starter hashtags (5)">
            <Input
              value={(launch.hashtags ?? []).join(", ")}
              onChange={(e) =>
                setLaunch({
                  ...launch,
                  hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </Labelled>
          <Labelled label="First-week post ideas (3)" className="md:col-span-2">
            <Textarea
              rows={3}
              value={(launch.first_week_ideas ?? []).join("\n")}
              onChange={(e) =>
                setLaunch({
                  ...launch,
                  first_week_ideas: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </Labelled>
        </CardContent>
      </Card>
    </div>
  );
}

function Labelled({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium capitalize">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
