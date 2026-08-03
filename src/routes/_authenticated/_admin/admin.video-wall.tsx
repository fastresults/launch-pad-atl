import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteVideoWallEntry,
  getVideoWallSettings,
  listAllVideoWallEntries,
  reorderVideoWall,
  updateVideoWallEntry,
  updateVideoWallSettings,
  type VideoWallSettings,
  type VideoWallEntryWithUrls,
} from "@/lib/video-wall.functions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { VideoWallForm } from "@/components/admin/VideoWallForm";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function AdminVideoWallPage() {
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<VideoWallEntryWithUrls | null | undefined>(undefined);

  const settingsQ = useQuery({ queryKey: ["admin_video_wall_settings"], queryFn: getVideoWallSettings });
  const listQ = useQuery({ queryKey: ["admin_video_wall"], queryFn: listAllVideoWallEntries });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin_video_wall"] });
    qc.invalidateQueries({ queryKey: ["public_video_wall"] });
  };

  const saveSettings = useMutation({
    mutationFn: (patch: Partial<VideoWallSettings>) => updateVideoWallSettings(patch),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin_video_wall_settings"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteVideoWallEntry(id),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const toggleLive = useMutation({
    mutationFn: ({ id, is_live }: { id: string; is_live: boolean }) =>
      updateVideoWallEntry(id, { is_live }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const reorder = useMutation({ mutationFn: reorderVideoWall, onSuccess: invalidate });

  const rows = listQ.data ?? [];
  const settings = settingsQ.data;

  function move(index: number, dir: -1 | 1) {
    const next = [...rows];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((r, i) => ({ id: r.id, sort_order: i })));
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Founder video wall"
        description="A separate video section shown immediately below the homepage hero."
      />

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <Switch
            id="wall-enabled"
            checked={settings?.enabled ?? true}
            onCheckedChange={(v) => saveSettings.mutate({ enabled: v })}
          />
          <Label htmlFor="wall-enabled">Show this section on the homepage</Label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Heading</Label>
            <Input
              defaultValue={settings?.heading ?? ""}
              key={settings?.heading}
              onBlur={(e) =>
                e.target.value !== settings?.heading && saveSettings.mutate({ heading: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Subheading</Label>
            <Input
              defaultValue={settings?.subheading ?? ""}
              key={settings?.subheading}
              onBlur={(e) =>
                e.target.value !== settings?.subheading &&
                saveSettings.mutate({ subheading: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {editing !== undefined ? (
        <VideoWallForm
          initial={editing}
          onSaved={() => {
            setEditing(undefined);
            invalidate();
          }}
          onCancel={() => setEditing(undefined)}
        />
      ) : (
        <Button onClick={() => setEditing(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Add founder video
        </Button>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Thumb</TableHead>
              <TableHead>Founder</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="w-24">Live</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No founder videos yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.poster_url ? (
                      <img
                        src={r.poster_url}
                        alt=""
                        className="h-14 w-9 rounded object-cover"
                      />
                    ) : (
                      <div className="h-14 w-9 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.founder_name}</div>
                    {r.startup_name ? (
                      <div className="text-xs text-muted-foreground">{r.startup_name}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.city ?? "—"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.is_live}
                      onCheckedChange={(v) => toggleLive.mutate({ id: r.id, is_live: v })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => move(i, 1)}
                        disabled={i === rows.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Delete this video?",
                            description: `${r.founder_name}'s story will be removed permanently.`,
                          });
                          if (ok) del.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
