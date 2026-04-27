-- ============ EXTEND PROFILES ============
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS hobbies TEXT,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS religion TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Nigerian',
  ADD COLUMN IF NOT EXISTS state_of_origin TEXT;

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS qualification TEXT,
  ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============ WALL POSTS ============
CREATE TABLE IF NOT EXISTS public.wall_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'text',
  visibility TEXT NOT NULL DEFAULT 'public',
  class_id UUID,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wall_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view wall posts"
  ON public.wall_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth users can create wall posts"
  ON public.wall_posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own posts"
  ON public.wall_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authors or admins can delete posts"
  ON public.wall_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX IF NOT EXISTS idx_wall_posts_created ON public.wall_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_posts_author ON public.wall_posts(author_id);

-- ============ WALL REACTIONS ============
CREATE TABLE IF NOT EXISTS public.wall_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.wall_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.wall_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view reactions"
  ON public.wall_reactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own reactions"
  ON public.wall_reactions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ WALL COMMENTS ============
CREATE TABLE IF NOT EXISTS public.wall_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.wall_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wall_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view comments"
  ON public.wall_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth create own comments"
  ON public.wall_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors or admins delete comments"
  ON public.wall_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX IF NOT EXISTS idx_wall_comments_post ON public.wall_comments(post_id);

-- ============ ENABLE REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_comments;

-- ============ UPDATE TRIGGER ============
CREATE TRIGGER update_wall_posts_updated_at
  BEFORE UPDATE ON public.wall_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();