import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitLandingFreeLaunchInquiry } from "@/lib/inquiries.functions";
import { ArrowRight, Check } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  idea: z.string().trim().min(1, "Tell us your idea in one sentence").max(500),
  why: z.string().trim().min(1, "Tell us why you, why now").max(1000),
});

export function LandingInterestModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", idea: "", why: "" });
  const [testimonialOk, setTestimonialOk] = useState(false);

  const reset = () => {
    setForm({ name: "", email: "", phone: "", city: "", idea: "", why: "" });
    setTestimonialOk(false);
    setDone(false);
    setError(null);
    setSubmitting(false);
  };

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(reset, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    try {
      const message = [
        `City: ${parsed.data.city || "—"}`,
        `Phone: ${parsed.data.phone || "—"}`,
        `Willing to give a brief video testimonial after the session: ${testimonialOk ? "Yes" : "No"}`,
        "",
        `Idea: ${parsed.data.idea}`,
        "",
        `Why you, why now: ${parsed.data.why}`,
      ].join("\n");
      await submitLandingFreeLaunchInquiry({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || undefined,
        subject: `Landing free-launch interest — ${parsed.data.name}`,
        message,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-[#E4D9C4] bg-[#FBF7F1] text-[#3D3025]">
        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#8B7355] text-[#FAF8F5]">
              <Check className="size-6" />
            </div>
            <DialogTitle className="font-serif text-2xl text-[#3D3025]">You're in the evaluation pool.</DialogTitle>
            <p className="mt-3 text-[#5C4A38]">
              Our evaluation team will reach out by <strong>July 30</strong>. Three Atlanta founders will be chosen for the August 6 morning — completely free.
            </p>
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#8B7355] px-6 py-2.5 text-sm font-semibold text-[#FAF8F5] transition-colors hover:bg-[#6E5B42]"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#3D3025]">Reserve your interest</DialogTitle>
              <DialogDescription className="text-[#5C4A38]">
                We're setting up 3 Atlanta entrepreneurs in business — absolutely free — on August 6. Tell us about you. Our evaluation team will get back to you by <strong>July 30</strong>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-2 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="li-name">Full name</Label>
                  <Input id="li-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
                </div>
                <div>
                  <Label htmlFor="li-phone">Phone (optional)</Label>
                  <Input id="li-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} />
                </div>
                <div>
                  <Label htmlFor="li-city">City</Label>
                  <Input id="li-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={100} />
                </div>
              </div>
              <div>
                <Label htmlFor="li-idea">Your business idea in one sentence</Label>
                <Textarea id="li-idea" value={form.idea} onChange={(e) => setForm({ ...form, idea: e.target.value })} required rows={2} maxLength={500} />
              </div>
              <div>
                <Label htmlFor="li-why">Why you? Why now?</Label>
                <Textarea id="li-why" value={form.why} onChange={(e) => setForm({ ...form, why: e.target.value })} required rows={3} maxLength={1000} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#8B7355] px-6 py-3 text-base font-semibold text-[#FAF8F5] transition-colors hover:bg-[#6E5B42] disabled:opacity-60"
              >
                {submitting ? "Sending..." : (<>Reserve my interest <ArrowRight className="size-4" /></>)}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
