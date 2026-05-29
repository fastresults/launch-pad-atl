
-- Enums
CREATE TYPE public.media_scope AS ENUM ('master', 'user');
CREATE TYPE public.media_type AS ENUM ('document', 'image', 'audio', 'video', 'other');
CREATE TYPE public.media_ai_status AS ENUM ('pending', 'processing', 'ready', 'failed', 'skipped');

-- Folders
CREATE TABLE public.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.media_scope NOT NULL,
  owner_user_id UUID,
  parent_id UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((scope = 'master' AND owner_user_id IS NULL) OR (scope = 'user' AND owner_user_id IS NOT NULL))
);
CREATE INDEX idx_media_folders_scope_owner ON public.media_folders(scope, owner_user_id);
CREATE INDEX idx_media_folders_parent ON public.media_folders(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_folders TO authenticated;
GRANT ALL ON public.media_folders TO service_role;

ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read folders"
ON public.media_folders FOR SELECT TO authenticated
USING (
  (scope = 'user' AND owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Insert folders"
ON public.media_folders FOR INSERT TO authenticated
WITH CHECK (
  (scope = 'user' AND owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Update folders"
ON public.media_folders FOR UPDATE TO authenticated
USING (
  (scope = 'user' AND owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Delete folders"
ON public.media_folders FOR DELETE TO authenticated
USING (
  (scope = 'user' AND owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE TRIGGER trg_media_folders_updated_at
BEFORE UPDATE ON public.media_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assets
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.media_scope NOT NULL,
  owner_user_id UUID,
  folder_id UUID REFERENCES public.media_folders(id) ON DELETE SET NULL,
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  original_name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  media_type public.media_type NOT NULL DEFAULT 'other',
  tags TEXT[] NOT NULL DEFAULT '{}',
  ai_status public.media_ai_status NOT NULL DEFAULT 'pending',
  ai_summary TEXT,
  ai_transcript TEXT,
  ai_tags TEXT[] NOT NULL DEFAULT '{}',
  ai_error TEXT,
  upload_status TEXT NOT NULL DEFAULT 'pending', -- pending | ready
  pushed_from_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  pushed_by UUID,
  pushed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((scope = 'master' AND owner_user_id IS NULL) OR (scope = 'user' AND owner_user_id IS NOT NULL))
);
CREATE INDEX idx_media_assets_scope_owner ON public.media_assets(scope, owner_user_id);
CREATE INDEX idx_media_assets_folder ON public.media_assets(folder_id);
CREATE INDEX idx_media_assets_media_type ON public.media_assets(media_type);
CREATE INDEX idx_media_assets_tags ON public.media_assets USING GIN(tags);
CREATE INDEX idx_media_assets_ai_tags ON public.media_assets USING GIN(ai_tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read assets"
ON public.media_assets FOR SELECT TO authenticated
USING (
  (scope = 'user' AND owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Insert assets"
ON public.media_assets FOR INSERT TO authenticated
WITH CHECK (
  (scope = 'user' AND owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Update assets"
ON public.media_assets FOR UPDATE TO authenticated
USING (
  (scope = 'user' AND owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);
CREATE POLICY "Delete assets"
ON public.media_assets FOR DELETE TO authenticated
USING (
  (scope = 'user' AND owner_user_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE TRIGGER trg_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Collections
CREATE TABLE public.media_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.media_scope NOT NULL,
  owner_user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((scope = 'master' AND owner_user_id IS NULL) OR (scope = 'user' AND owner_user_id IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_collections TO authenticated;
GRANT ALL ON public.media_collections TO service_role;
ALTER TABLE public.media_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read collections" ON public.media_collections FOR SELECT TO authenticated
USING ((scope='user' AND owner_user_id=auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Write collections" ON public.media_collections FOR INSERT TO authenticated
WITH CHECK ((scope='user' AND owner_user_id=auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Update collections" ON public.media_collections FOR UPDATE TO authenticated
USING ((scope='user' AND owner_user_id=auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Delete collections" ON public.media_collections FOR DELETE TO authenticated
USING ((scope='user' AND owner_user_id=auth.uid()) OR public.is_admin(auth.uid()));
CREATE TRIGGER trg_media_collections_updated_at BEFORE UPDATE ON public.media_collections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.media_collection_items (
  collection_id UUID NOT NULL REFERENCES public.media_collections(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, asset_id)
);
GRANT SELECT, INSERT, DELETE ON public.media_collection_items TO authenticated;
GRANT ALL ON public.media_collection_items TO service_role;
ALTER TABLE public.media_collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read collection items" ON public.media_collection_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.media_collections c WHERE c.id=collection_id AND ((c.scope='user' AND c.owner_user_id=auth.uid()) OR public.is_admin(auth.uid()))));
CREATE POLICY "Insert collection items" ON public.media_collection_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.media_collections c WHERE c.id=collection_id AND ((c.scope='user' AND c.owner_user_id=auth.uid()) OR public.is_admin(auth.uid()))));
CREATE POLICY "Delete collection items" ON public.media_collection_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.media_collections c WHERE c.id=collection_id AND ((c.scope='user' AND c.owner_user_id=auth.uid()) OR public.is_admin(auth.uid()))));

-- Push log
CREATE TABLE public.media_push_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  target_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  target_user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.media_push_log TO authenticated;
GRANT ALL ON public.media_push_log TO service_role;
ALTER TABLE public.media_push_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read push log" ON public.media_push_log FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert push log" ON public.media_push_log FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('master-media', 'master-media', false, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-media', 'user-media', false, 104857600, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: master-media → admin only
CREATE POLICY "master-media admin read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'master-media' AND public.is_admin(auth.uid()));
CREATE POLICY "master-media admin insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'master-media' AND public.is_admin(auth.uid()));
CREATE POLICY "master-media admin update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'master-media' AND public.is_admin(auth.uid()));
CREATE POLICY "master-media admin delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'master-media' AND public.is_admin(auth.uid()));

-- Storage policies: user-media → owner per first folder, admin all
CREATE POLICY "user-media owner read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-media' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR public.is_admin(auth.uid())));
CREATE POLICY "user-media owner insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-media' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR public.is_admin(auth.uid())));
CREATE POLICY "user-media owner update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-media' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR public.is_admin(auth.uid())));
CREATE POLICY "user-media owner delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-media' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR public.is_admin(auth.uid())));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media_collections;
