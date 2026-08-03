import { useEffect, useRef, useState } from "react";
import {
  createVideoWallEntry,
  updateVideoWallEntry,
  uploadVideoWallFile,
  type VideoWallEntryWithUrls,
} from "@/lib/video-wall.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

type Props = {
  initial?: VideoWallEntryWithUrls | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function VideoWallForm({ initial, onSaved, onCancel }: Props) {
  const [founderName, setFounderName] = useState(initial?.founder_name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [founderRole, setFounderRole] = useState(initial?.founder_role ?? "");
  const [startupName, setStartupName] = useState(initial?.startup_name ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [isLive, setIsLive] = useState(initial?.is_live ?? false);
  const [videoBucket, setVideoBucket] = useState(initial?.video_bucket ?? "founder-videos");
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

  /** Grab a frame from the uploaded video to use as a poster when none is provided. */
  async function captureFrame(file: File): Promise<Blob | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;
      const cleanup = () => URL.revokeObjectURL(url);
      v.onloadeddata = () => {
        v.currentTime = Math.min(1, (v.duration || 2) / 3);
      };
      v.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          return resolve(null);
        }
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => {
          cleanup();
          resolve(b);
        }, "image/jpeg", 0.82);
      };
      v.onerror = () => {
        cleanup();
        resolve(null);
      };
    });
  }

  async function handleVideoUpload(file: File) {
    setUploadingVideo(true);
    try {
      if (file.size > 200 * 1024 * 1024) throw new Error("Video must be under 200 MB");
      const { bucket, path } = await uploadVideoWallFile(file, "video");
      setVideoBucket(bucket);
      setVideoPath(path);
      setVideoPreview(URL.createObjectURL(file));

      if (!posterPath) {
        const frame = await captureFrame(file);
        if (frame) {
          const posterFile = new File([frame], "poster.jpg", { type: "image/jpeg" });
          const p = await uploadVideoWallFile(posterFile, "poster");
          setPosterBucket(p.bucket);
          setPosterPath(p.path);
          setPosterPreview(URL.createObjectURL(frame));
        }
      }
      toast.success("Video uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handlePosterUpload(file: File) {
    setUploadingPoster(true);
    try {
      const { bucket, path } = await uploadVideoWallFile(file, "poster");
      setPosterBucket(bucket);
      setPosterPath(path);
      setPosterPreview(URL.createObjectURL(file));
      toast.success("Thumbnail uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploadingPoster(false);
    }
  }

  async function handleSave() {
    if (!founderName.trim()) return toast.error("Founder name is required");
    if (!videoPath) return toast.error("Upload a video first");
    setSaving(true);
    try {
      const payload = {
        founder_name: founderName.trim(),
        city: city.trim() || null,
        founder_role: founderRole.trim() || null,
        startup_name: startupName.trim() || null,
        quote: quote.trim() || null,
        video_bucket: videoBucket,
        video_path: videoPath,
        poster_bucket: posterBucket || null,
        poster_path: posterPath || null,
        duration_seconds: duration,
        sort_order: Number(sortOrder) || 0,
        is_live: isLive,
      };
      if (initial) await updateVideoWallEntry(initial.id, payload);
      else await createVideoWallEntry(payload);
      toast.success(initial ? "Story updated" : "Story added");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Founder name *</Label>
          <Input value={founderName} onChange={(e) => setFounderName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Atlanta, GA" />
        </div>
        <div className="space-y-1.5">
          <Label>Role (optional)</Label>
          <Input value={founderRole} onChange={(e) => setFounderRole(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Startup name (optional)</Label>
          <Input value={startupName} onChange={(e) => setStartupName(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Quote (optional)</Label>
        <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={2} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Video *</Label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingVideo}
          >
            {uploadingVideo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {videoPath ? "Replace video" : "Upload video"}
          </Button>
          {videoPreview ? (
            <video
              ref={videoRef}
              src={videoPreview}
              controls
              className="max-h-56 w-full rounded-md border bg-black object-contain"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Thumbnail (auto-captured if blank)</Label>
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePosterUpload(e.target.files[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => posterInputRef.current?.click()}
            disabled={uploadingPoster}
          >
            {uploadingPoster ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {posterPath ? "Replace thumbnail" : "Upload thumbnail"}
          </Button>
          {posterPreview ? (
            <img
              src={posterPreview}
              alt="Thumbnail preview"
              className="max-h-56 rounded-md border object-contain"
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="space-y-1.5">
          <Label>Order</Label>
          <Input
            type="number"
            className="w-24"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <Switch checked={isLive} onCheckedChange={setIsLive} id="wall-live" />
          <Label htmlFor="wall-live">Live on homepage</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initial ? "Save changes" : "Add story"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
