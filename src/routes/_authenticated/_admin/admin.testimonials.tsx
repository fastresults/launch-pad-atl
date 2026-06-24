import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTestimonial,
  getTestimonialSettings,
  listAllTestimonials,
  reorderTestimonials,
  updateTestimonialSettings,
  type TestimonialSliderSettings,
  type TestimonialWithUrls,
} from "@/lib/testimonials.functions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TestimonialForm } from "@/components/admin/TestimonialForm";

export default function AdminTestimonialsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TestimonialWithUrls | null | undefined>(undefined);

  const settingsQ = useQuery({ queryKey: ["admin_testimonial_settings"], queryFn: getTestimonialSettings });
  const listQ = useQuery({ queryKey: ["admin_testimonials"], queryFn: listAllTestimonials });

  const saveSettings = useMutation({
    mutationFn: (patch: Partial<TestimonialSliderSettings>) => updateTestimonialSettings(patch),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin_testimonial_settings"] });
      qc.invalidateQueries({ queryKey: ["testimonial_settings"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteTestimonial(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin_testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials_published"] });
    },
  });

  const reorder = useMutation({
    mutationFn: reorderTestimonials,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_testimonials"] });
      qc.invalidateQueries({ queryKey: ["testimonials_published"] });
    },
  });

  const settings = settingsQ.data;
  const items = listQ.data ?? [];

  function move(idx: number, dir: -1 | 1) {
    const arr = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    const payload = arr.map((it, i) => ({ id: it.id, sort_order: i }));
    reorder.mutate(payload);
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Video testimonials"
        description="Manage the autoplay video testimonial slider that appears below the homepage hero."
      />

      {/* Master on/off */}
      {settings && (
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Homepage slider</h2>
              <p className="text-sm text-muted-foreground">
                Show or hide the video testimonial slider on the public homepage.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
                {saveSettings.isPending ? "Saving…" : settings.enabled ? "On" : "Off"}
              </span>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(v) => saveSettings.mutate({ enabled: v })}
                disabled={saveSettings.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Slider settings</h2>
        {settings && (
          <SettingsForm
            initial={settings}
            onSave={(patch) => saveSettings.mutate(patch)}
            saving={saveSettings.isPending}
          />
        )}
      </div>


      {/* Testimonials */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Testimonials ({items.length})</h2>
          <Button onClick={() => setEditing(null)} size="sm">
            <Plus className="mr-1 size-4" /> Add testimonial
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Preview</TableHead>
              <TableHead>Founder</TableHead>
              <TableHead>Startup</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No testimonials yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {items.map((it, idx) => (
              <TableRow key={it.id}>
                <TableCell>
                  {it.poster_url ? (
                    <img src={it.poster_url} alt="" className="h-12 w-20 rounded object-cover" />
                  ) : it.video_url ? (
                    <video src={it.video_url} muted className="h-12 w-20 rounded bg-black object-cover" />
                  ) : (
                    <div className="h-12 w-20 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{it.founder_name}</div>
                  {it.founder_role && (
                    <div className="text-xs text-muted-foreground">{it.founder_role}</div>
                  )}
                </TableCell>
                <TableCell>{it.startup_name ?? "—"}</TableCell>
                <TableCell>{it.duration_seconds ? `${it.duration_seconds}s` : "—"}</TableCell>
                <TableCell>
                  <Badge variant={it.status === "published" ? "default" : "secondary"}>
                    {it.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(it)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Delete this testimonial? This also deletes the uploaded files.")) {
                          del.mutate(it.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit testimonial" : "Add testimonial"}</DialogTitle>
          </DialogHeader>
          <TestimonialForm
            initial={editing ?? null}
            onCancel={() => setEditing(undefined)}
            onSaved={() => {
              setEditing(undefined);
              qc.invalidateQueries({ queryKey: ["admin_testimonials"] });
              qc.invalidateQueries({ queryKey: ["testimonials_published"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsForm({
  initial,
  onSave,
  saving,
}: {
  initial: TestimonialSliderSettings;
  onSave: (patch: Partial<TestimonialSliderSettings>) => void;
  saving: boolean;
}) {
  const [s, setS] = useState<TestimonialSliderSettings>(initial);
  const set = <K extends keyof TestimonialSliderSettings>(k: K, v: TestimonialSliderSettings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="grid gap-4 md:grid-cols-2">

      <div className="space-y-2">
        <Label>Heading</Label>
        <Input value={s.heading} onChange={(e) => set("heading", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Subheading</Label>
        <Input value={s.subheading} onChange={(e) => set("subheading", e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Scroll speed (px / second)</Label>
        <Input
          type="number"
          min={10}
          max={200}
          step={5}
          value={s.scroll_speed_px_s}
          onChange={(e) => set("scroll_speed_px_s", Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">Lower = slower. Hover pauses the row.</p>
      </div>

      <div className="space-y-2">
        <Label>Direction</Label>
        <select
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={s.direction}
          onChange={(e) => set("direction", e.target.value as "left" | "right")}
        >
          <option value="left">Right → Left</option>
          <option value="right">Left → Right</option>
        </select>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
        <Label>Show on mobile</Label>
        <Switch checked={s.show_on_mobile} onCheckedChange={(v) => set("show_on_mobile", v)} />
      </div>

      <div className="md:col-span-2 flex justify-end">
        <Button onClick={() => onSave(s)} disabled={saving}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
