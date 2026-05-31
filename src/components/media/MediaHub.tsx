import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptDialog } from "@/components/ui/confirm-dialog";
import {
  createSignedUploadUrl,
  finalizeUpload,
  listMedia,
  listFolders,
  listCollections,
  createFolder,
  createCollection,
  getAssetSignedUrl,
  updateAsset,
  deleteAsset,
  pushAssetsToUsers,
  listAttendeesForPush,
  reprocessAi,
  toggleCollectionItem,
} from "@/lib/media.functions";
import {
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  File as FileIcon,
  Folder,
  FolderPlus,
  Upload,
  Trash2,
  Download,
  Sparkles,
  Send,
  Loader2,
  LayoutGrid,
  List as ListIcon,
  Library,
  Eye,
  Link2,
} from "lucide-react";

type Scope = "master" | "user";
type MediaType = "document" | "image" | "audio" | "video" | "other";
type ViewMode = "grid" | "list";

type Asset = {
  id: string;
  scope: Scope;
  owner_user_id: string | null;
  folder_id: string | null;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string | null;
  original_name: string;
  title: string | null;
  description: string | null;
  mime_type: string;
  size_bytes: number;
  media_type: MediaType;
  tags: string[];
  ai_status: "pending" | "processing" | "ready" | "failed" | "skipped";
  ai_summary: string | null;
  ai_transcript: string | null;
  ai_tags: string[];
  ai_error: string | null;
  upload_status: string;
  pushed_from_asset_id: string | null;
  pushed_by: string | null;
  pushed_at: string | null;
  created_at: string;
};

interface Props {
  scope: Scope;
  ownerUserId?: string | null;
  canAdminPush?: boolean;
  title?: string;
}

const TYPE_ICONS: Record<MediaType, typeof FileIcon> = {
  document: FileText,
  image: ImageIcon,
  audio: Music,
  video: Video,
  other: FileIcon,
};

function humanSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

type DragPayload = { ids: string[] };
const DRAG_MIME = "application/x-media-asset-ids";

export function MediaHub({ scope, ownerUserId, canAdminPush, title }: Props) {
  const qc = useQueryClient();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pushDialogOpen, setPushDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [promptKind, setPromptKind] = useState<"folder" | "collection" | null>(null);

  // Load persisted view mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem("media-hub-view");
    if (v === "grid" || v === "list") setViewMode(v);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("media-hub-view", viewMode);
  }, [viewMode]);

  const listFn = useServerFn(listMedia);
  const foldersFn = useServerFn(listFolders);
  const collectionsFn = useServerFn(listCollections);
  const createFolderFn = useServerFn(createFolder);
  const createCollectionFn = useServerFn(createCollection);
  const createSignedFn = useServerFn(createSignedUploadUrl);
  const finalizeFn = useServerFn(finalizeUpload);
  const getUrlFn = useServerFn(getAssetSignedUrl);
  const updateFn = useServerFn(updateAsset);
  const deleteFn = useServerFn(deleteAsset);
  const reprocessFn = useServerFn(reprocessAi);
  const toggleCollectionFn = useServerFn(toggleCollectionItem);

  const queryKey = ["media", scope, ownerUserId, folderId, collectionId, mediaType, search];
  const assetsQ = useQuery({
    queryKey,
    queryFn: () =>
      listFn({
        data: {
          scope,
          ownerUserId: ownerUserId ?? null,
          folderId: collectionId ? undefined : folderId,
          collectionId,
          mediaType: mediaType === "all" ? null : mediaType,
          search: search || null,
        },
      }),
  });

  const foldersQ = useQuery({
    queryKey: ["media-folders", scope, ownerUserId],
    queryFn: () => foldersFn({ data: { scope, ownerUserId: ownerUserId ?? null } }),
  });

  const collectionsQ = useQuery({
    queryKey: ["media-collections", scope, ownerUserId],
    queryFn: () => collectionsFn({ data: { scope, ownerUserId: ownerUserId ?? null } }),
  });

  const assets = (assetsQ.data?.assets ?? []) as Asset[];
  const folders = foldersQ.data?.folders ?? [];
  const collections = collectionsQ.data?.collections ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["media"] });

  // ===== Upload =====
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        if (file.size > 100 * 1024 * 1024) {
          toast.error(`${file.name}: exceeds 100MB`);
          continue;
        }
        const { uploadUrl, asset } = await createSignedFn({
          data: {
            scope,
            ownerUserId: ownerUserId ?? null,
            folderId,
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          },
        });
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
        await finalizeFn({ data: { assetId: asset.id } });
        toast.success(`Uploaded ${file.name}`);
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    setUploading(false);
    invalidate();
  }

  // ===== Folder / collection create =====
  const createFolderMu = useMutation({
    mutationFn: (name: string) =>
      createFolderFn({ data: { scope, ownerUserId: ownerUserId ?? null, name, parentId: folderId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-folders", scope, ownerUserId] });
      toast.success("Folder created");
    },
  });
  const createCollectionMu = useMutation({
    mutationFn: (name: string) =>
      createCollectionFn({ data: { scope, ownerUserId: ownerUserId ?? null, name } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-collections", scope, ownerUserId] });
      toast.success("Collection created");
    },
  });

  // ===== Select & preview =====
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function openAsset(asset: Asset) {
    setSelectedAsset(asset);
    setPreviewUrl(null);
    try {
      const { url } = await getUrlFn({ data: { assetId: asset.id } });
      setPreviewUrl(url);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function copyAssetUrl(assetId: string) {
    try {
      const { url } = await getUrlFn({ data: { assetId } });
      await navigator.clipboard.writeText(url);
      toast.success("Link copied (valid 1 hour)");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // ===== Drag & drop =====
  function handleDragStart(e: React.DragEvent, assetId: string) {
    // If dragging an asset that's part of the multi-selection, drag the whole selection.
    const ids = selectedIds.has(assetId) ? Array.from(selectedIds) : [assetId];
    const payload: DragPayload = { ids };
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  }
  function handleDragEnd() {
    setIsDragging(false);
    setDropTargetKey(null);
  }
  function readPayload(e: React.DragEvent): DragPayload | null {
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DragPayload;
    } catch {
      return null;
    }
  }

  async function dropOnFolder(e: React.DragEvent, targetFolderId: string | null) {
    e.preventDefault();
    setDropTargetKey(null);
    const p = readPayload(e);
    if (!p || p.ids.length === 0) return;
    try {
      await Promise.all(p.ids.map((id) => updateFn({ data: { id, folderId: targetFolderId } })));
      toast.success(`Moved ${p.ids.length} file${p.ids.length === 1 ? "" : "s"}`);
      setSelectedIds(new Set());
      invalidate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function dropOnCollection(e: React.DragEvent, targetCollectionId: string) {
    e.preventDefault();
    setDropTargetKey(null);
    const p = readPayload(e);
    if (!p || p.ids.length === 0) return;
    try {
      await Promise.all(
        p.ids.map((id) =>
          toggleCollectionFn({
            data: { collectionId: targetCollectionId, assetId: id, action: "add" },
          }),
        ),
      );
      toast.success(`Added ${p.ids.length} to collection`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  // ===== Tag editor in drawer =====
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  useMemo(() => {
    if (selectedAsset) {
      setEditTitle(selectedAsset.title ?? selectedAsset.original_name);
      setEditDesc(selectedAsset.description ?? "");
      setEditTags(selectedAsset.tags.join(", "));
    }
  }, [selectedAsset]);

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!selectedAsset) return;
      await updateFn({
        data: {
          id: selectedAsset.id,
          title: editTitle,
          description: editDesc,
          tags: editTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      });
    },
    onSuccess: () => {
      toast.success("Saved");
      invalidate();
    },
  });

  const removeAsset = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      setSelectedAsset(null);
      invalidate();
    },
  });

  // ===== Sidebar drop target helpers =====
  const dropTargetClass = (key: string) =>
    `${dropTargetKey === key ? "ring-2 ring-primary bg-primary/10" : ""} ${
      isDragging ? "outline outline-1 outline-dashed outline-muted-foreground/30" : ""
    }`;

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Folders</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setPromptKind("folder")}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          <button
            onClick={() => {
              setFolderId(null);
              setCollectionId(null);
            }}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
              e.preventDefault();
              setDropTargetKey("folder:null");
            }}
            onDragLeave={() => setDropTargetKey(null)}
            onDrop={(e) => dropOnFolder(e, null)}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition ${
              folderId === null && !collectionId
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            } ${dropTargetClass("folder:null")}`}
          >
            <Folder className="h-4 w-4" /> All files
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFolderId(f.id);
                setCollectionId(null);
              }}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
                e.preventDefault();
                setDropTargetKey(`folder:${f.id}`);
              }}
              onDragLeave={() => setDropTargetKey(null)}
              onDrop={(e) => dropOnFolder(e, f.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition ${
                folderId === f.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
              } ${dropTargetClass(`folder:${f.id}`)}`}
            >
              <Folder className="h-4 w-4" /> {f.name}
            </button>
          ))}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</h3>
          <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as MediaType | "all")}>
            <TabsList className="grid h-auto grid-cols-2 gap-1">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="document">Docs</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Collections</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setPromptKind("collection")}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          {collections.length === 0 ? (
            <p className="text-xs text-muted-foreground">No collections yet</p>
          ) : (
            collections.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCollectionId(c.id);
                  setFolderId(null);
                }}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
                  e.preventDefault();
                  setDropTargetKey(`coll:${c.id}`);
                }}
                onDragLeave={() => setDropTargetKey(null)}
                onDrop={(e) => dropOnCollection(e, c.id)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition ${
                  collectionId === c.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                } ${dropTargetClass(`coll:${c.id}`)}`}
              >
                <Library className="h-4 w-4" /> {c.name}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {title ? <h2 className="mr-auto text-lg font-semibold">{title}</h2> : null}
          <Input
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <div className="flex rounded-md border">
            <Button
              type="button"
              size="icon"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
          {canAdminPush && selectedIds.size > 0 && (
            <Button variant="default" onClick={() => setPushDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" /> Push to users ({selectedIds.size})
            </Button>
          )}
        </div>

        {collectionId && (
          <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Library className="h-3.5 w-3.5" />
            Viewing collection: {collections.find((c) => c.id === collectionId)?.name}
            <button
              className="ml-auto underline hover:text-foreground"
              onClick={() => setCollectionId(null)}
            >
              Clear
            </button>
          </div>
        )}

        {assetsQ.isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : assets.length === 0 ? (
          <Card
            className="flex flex-col items-center justify-center gap-3 border-dashed py-16 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
            }}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drop files here or click Upload</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((a) => {
              const Icon = TYPE_ICONS[a.media_type];
              const isSelected = selectedIds.has(a.id);
              return (
                <Card
                  key={a.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, a.id)}
                  onDragEnd={handleDragEnd}
                  className={`group relative cursor-pointer overflow-hidden p-0 transition hover:border-primary/50 ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => openAsset(a)}
                >
                  <div
                    className="absolute left-2 top-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(a.id);
                    }}
                  >
                    <Checkbox checked={isSelected} />
                  </div>
                  <div className="flex aspect-square items-center justify-center bg-muted/30">
                    {a.media_type === "image" && a.upload_status === "ready" ? (
                      <AssetThumb assetId={a.id} />
                    ) : (
                      <Icon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      title="Preview"
                      onClick={() => openAsset(a)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      title="Copy link"
                      onClick={() => copyAssetUrl(a.id)}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium">{a.title ?? a.original_name}</p>
                    <p className="text-xs text-muted-foreground">{humanSize(a.size_bytes)}</p>
                    <div className="flex flex-wrap gap-1">
                      {a.pushed_from_asset_id && (
                        <Badge variant="secondary" className="text-[10px]">
                          Pushed
                        </Badge>
                      )}
                      {a.ai_status === "ready" && a.ai_tags.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          <Sparkles className="mr-1 h-2.5 w-2.5" />
                          {a.ai_tags.length} tags
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y">
              <div className="grid grid-cols-[36px_44px_1fr_90px_90px_140px_88px] items-center gap-3 bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div></div>
                <div></div>
                <div>Name</div>
                <div>Type</div>
                <div>Size</div>
                <div>Uploaded</div>
                <div className="text-right">Actions</div>
              </div>
              {assets.map((a) => {
                const Icon = TYPE_ICONS[a.media_type];
                const isSelected = selectedIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, a.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openAsset(a)}
                    className={`grid cursor-pointer grid-cols-[36px_44px_1fr_90px_90px_140px_88px] items-center gap-3 px-3 py-2 text-sm transition hover:bg-muted/40 ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(a.id)} />
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-muted/40">
                      {a.media_type === "image" && a.upload_status === "ready" ? (
                        <AssetThumb assetId={a.id} />
                      ) : (
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.title ?? a.original_name}</p>
                      {a.ai_summary && (
                        <p className="truncate text-xs text-muted-foreground">{a.ai_summary}</p>
                      )}
                    </div>
                    <div>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {a.media_type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{humanSize(a.size_bytes)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </div>
                    <div
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Preview"
                        onClick={() => openAsset(a)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Copy link"
                        onClick={() => copyAssetUrl(a.id)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selectedAsset} onOpenChange={(o) => !o && setSelectedAsset(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedAsset && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedAsset.title ?? selectedAsset.original_name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="rounded border bg-muted/30 p-2">
                  <Preview asset={selectedAsset} url={previewUrl} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewUrl && (
                    <a href={previewUrl} download={selectedAsset.original_name} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!previewUrl}
                    onClick={async () => {
                      if (!previewUrl) return;
                      await navigator.clipboard.writeText(previewUrl);
                      toast.success("Link copied (valid 1 hour)");
                    }}
                  >
                    <Link2 className="mr-2 h-4 w-4" /> Copy link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reprocessFn({ data: { assetId: selectedAsset.id } }).then(() => invalidate())}
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Re-run AI
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Delete this file?")) removeAsset.mutate(selectedAsset.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Shared links are signed and expire in 1 hour.</p>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Title</label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Description</label>
                  <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Tags (comma separated)</label>
                  <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Folder</label>
                  <Select
                    value={selectedAsset.folder_id ?? "none"}
                    onValueChange={(v) =>
                      updateFn({
                        data: { id: selectedAsset.id, folderId: v === "none" ? null : v },
                      }).then(() => invalidate())
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No folder</SelectItem>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {collections.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">Add to collection</label>
                    <Select
                      value=""
                      onValueChange={(v) =>
                        toggleCollectionFn({
                          data: { collectionId: v, assetId: selectedAsset.id, action: "add" },
                        }).then(() => {
                          toast.success("Added to collection");
                          invalidate();
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a collection…" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={() => saveEdit.mutate()} disabled={saveEdit.isPending} className="w-full">
                  Save changes
                </Button>

                {(selectedAsset.ai_summary || selectedAsset.ai_tags.length > 0 || selectedAsset.ai_transcript) && (
                  <div className="rounded border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4" /> AI Analysis
                    </div>
                    {selectedAsset.ai_summary && (
                      <p className="text-sm text-muted-foreground">{selectedAsset.ai_summary}</p>
                    )}
                    {selectedAsset.ai_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedAsset.ai_tags.map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {selectedAsset.ai_transcript && (
                      <div className="max-h-48 overflow-y-auto rounded bg-background p-2 text-xs">
                        {selectedAsset.ai_transcript}
                      </div>
                    )}
                  </div>
                )}
                {selectedAsset.ai_status === "failed" && (
                  <p className="text-xs text-destructive">AI failed: {selectedAsset.ai_error}</p>
                )}
                {selectedAsset.ai_status === "skipped" && (
                  <p className="text-xs text-muted-foreground">{selectedAsset.ai_error ?? "AI skipped"}</p>
                )}
                <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <dt>Type</dt>
                  <dd>{selectedAsset.mime_type}</dd>
                  <dt>Size</dt>
                  <dd>{humanSize(selectedAsset.size_bytes)}</dd>
                  <dt>Uploaded</dt>
                  <dd>{new Date(selectedAsset.created_at).toLocaleString()}</dd>
                  {selectedAsset.pushed_at && (
                    <>
                      <dt>Pushed</dt>
                      <dd>{new Date(selectedAsset.pushed_at).toLocaleString()}</dd>
                    </>
                  )}
                </dl>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {canAdminPush && (
        <PushDialog
          open={pushDialogOpen}
          onOpenChange={setPushDialogOpen}
          sourceIds={Array.from(selectedIds)}
          onDone={() => {
            setSelectedIds(new Set());
            invalidate();
          }}
        />
      )}

      <PromptDialog
        open={promptKind !== null}
        onOpenChange={(o) => !o && setPromptKind(null)}
        title={promptKind === "collection" ? "New collection" : "New folder"}
        inputLabel={promptKind === "collection" ? "Collection name" : "Folder name"}
        placeholder={promptKind === "collection" ? "e.g. Pitch deck assets" : "e.g. Brand"}
        confirmLabel="Create"
        maxLength={80}
        loading={promptKind === "folder" ? createFolderMu.isPending : createCollectionMu.isPending}
        onConfirm={(name) => {
          if (promptKind === "folder") createFolderMu.mutate(name);
          else if (promptKind === "collection") createCollectionMu.mutate(name);
          setPromptKind(null);
        }}
      />
    </div>
  );
}

function AssetThumb({ assetId }: { assetId: string }) {
  const getUrlFn = useServerFn(getAssetSignedUrl);
  const { data } = useQuery({
    queryKey: ["asset-thumb", assetId],
    queryFn: () => getUrlFn({ data: { assetId } }),
    staleTime: 1000 * 60 * 30,
  });
  if (!data?.url) return <ImageIcon className="h-12 w-12 text-muted-foreground" />;
  return <img src={data.url} alt="" className="h-full w-full object-cover" />;
}

function Preview({ asset, url }: { asset: Asset; url: string | null }) {
  if (!url) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (asset.media_type === "image") return <img src={url} alt="" className="mx-auto max-h-72 object-contain" />;
  if (asset.media_type === "video") return <video src={url} controls className="w-full max-h-72" />;
  if (asset.media_type === "audio") return <audio src={url} controls className="w-full" />;
  if (asset.mime_type === "application/pdf")
    return <iframe src={url} className="h-80 w-full" title={asset.original_name} />;
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      No inline preview. Use Download to view.
    </div>
  );
}

function PushDialog({
  open,
  onOpenChange,
  sourceIds,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sourceIds: string[];
  onDone: () => void;
}) {
  const listAttendees = useServerFn(listAttendeesForPush);
  const pushFn = useServerFn(pushAssetsToUsers);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const { data } = useQuery({
    queryKey: ["push-attendees"],
    queryFn: () => listAttendees(),
    enabled: open,
  });
  const attendees = data?.attendees ?? [];

  const mu = useMutation({
    mutationFn: () =>
      pushFn({
        data: {
          sourceAssetIds: sourceIds,
          targetUserIds: Array.from(selected),
          note: note || undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success(`Pushed: ${res.ok} ok, ${res.failed} failed`);
      if (res.errors.length) console.warn(res.errors);
      onOpenChange(false);
      setSelected(new Set());
      setNote("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Push {sourceIds.length} file{sourceIds.length === 1 ? "" : "s"} to users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium uppercase text-muted-foreground">Select users</label>
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded border p-2">
              {attendees.map((a) => (
                <label key={a.user_id} className="flex items-center gap-2 py-1 text-sm">
                  <Checkbox
                    checked={selected.has(a.user_id)}
                    onCheckedChange={(c) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (c) next.add(a.user_id);
                        else next.delete(a.user_id);
                        return next;
                      });
                    }}
                  />
                  <span>{a.display_name ?? a.email}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase text-muted-foreground">Note (optional)</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={selected.size === 0 || mu.isPending} onClick={() => mu.mutate()}>
            {mu.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Push
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
