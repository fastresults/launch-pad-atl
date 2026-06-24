import { useEffect, useRef, useState } from "react";
import {
  createTestimonial,
  updateTestimonial,
  uploadTestimonialFile,
  type TestimonialWithUrls,
} from "@/lib/testimonials.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

type Props = {
  initial?: TestimonialWithUrls | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function TestimonialForm({ initial, onSaved, onCancel }: Props) {
  const [founderName, setFounderName] = useState(initial?.founder_name ?? "");
  const [founderRole, setFounderRole] = useState(initial?.founder_role ?? "");
  const [startupName, setStartupName] = useState(initial?.startup_name ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [published, setPublished] = useState(initial?.status === "published");
  const [videoBucket, setVideoBucket] = useState(initial?.video_bucket ?? "master-media");
  const [videoPath, setVideoPath] = useState(initial?.video_path ?? "");
  const [posterBucket, setPosterBucket] = useState(initial?.poster_bucket ?? "");
  const [posterPath, setPosterPath] = useState(initial?.poster_path ?? "");
  const [videoPreview, setVideoPreview] = useState<string | null>(initial?.video_url ?? null);
  const [posterPreview, setPosterPreview] = useState<string | null>(initial?.poster_url ?? null);
  const [duration, setDuration] = useState<number | null>(initial?.duration_seconds ?? null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Probe duration from new preview
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      if (!Number.isNaN(v.duration) && Number.isFinite(v.duration)) {
        setDuration(Math.round(v.duration * 10) / 10);
      }
    };
    v.addEventListener("loadedmetadata", onMeta);
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, [videoPreview]);

  async function handleVideoUpload(file: File) {
    setUploadingVideo(true);
    try {
      if (file.size > 200 * 1024 * 1024) {
        throw new Error("Video must be under 200 MB");
      }
      const { bucket, path } = await uploadTestimonialFile(file, "video");
      setVideoBucket(bucket);
      setVideoPath(path);
      setVideoPreview(URL.createObjectURL(file));
      toast.success("Video uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handlePosterUpload(file: File) {
    setUploadingPoster(true);
    try {
      const { bucket, path } = await uploadTestimonialFile(file, "poster");
      setPosterBucket(bucket);
      setPosterPath(path);
      setPosterPreview(URL.createObjectURL(file));
      toast.success("Poster uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploadingPoster(false);
    }
  }

  async function handleSave() {
    if (!founderName.trim()) return toast.error("Founder name required");
    if (!videoPath) return toast.error("Video required");
    setSaving(true);
    try {
      const payload = {
        founder_name: founderName.trim(),
        founder_role: founderRole.trim() || null,
        startup_name: startupName.trim() || null,
        quote: quote.trim() || null,
        video_bucket: videoBucket,
        video_path: videoPath,
        poster_bucket: posterPath ? posterBucket || "master-media" : null,
        poster_path: posterPath || null,
        duration_seconds: duration,
        sort_order: Number(sortOrder) || 0,
        status: published ? "published" : "draft",
      } as any;

      if (initial) {
        await updateTestimonial(initial.id, payload);
      } else {
        await createTestimonial(payload);
      }
      toast.success("Saved");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Founder name *</Label>
          <Input value={founderName} onChange={(e) => setFounderName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Founder role / title</Label>
          <Input value={founderRole} onChange={(e) => setFounderRole(e.target.value)} placeholder="CEO" />
        </div>
        <div className="space-y-2">
          <Label>Startup name</Label>
          <Input value={startupName} onChange={(e) => setStartupName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Sort order</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Short quote (optional)</Label>
          <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={2} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Video file *</Label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleVideoUpload(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingVideo}
          >
            {uploadingVideo ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            {videoPath ? "Replace video" : "Upload video"}
          </Button>
          {videoPreview && (
            <video
              ref={videoRef}
              src={videoPreview}
              controls
              muted
              className="mt-2 w-full rounded-md bg-black"
            />
          )}
          {duration !== null && (
            <p className="text-xs text-muted-foreground">Duration: {duration}s</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Poster image (optional)</Label>
          <input
            ref={posterInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePosterUpload(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => posterInputRef.current?.click()}
            disabled={uploadingPoster}
          >
            {uploadingPoster ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            {posterPath ? "Replace poster" : "Upload poster"}
          </Button>
          {posterPreview && (
            <img src={posterPreview} alt="Poster" className="mt-2 w-full rounded-md" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label className="cursor-pointer">Published</Label>
          <p className="text-xs text-muted-foreground">Visible on the homepage when on.</p>
        </div>
        <Switch checked={published} onCheckedChange={setPublished} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
