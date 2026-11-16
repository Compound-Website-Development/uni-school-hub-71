ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS starts_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ends_at timestamp with time zone;

ALTER TABLE public.school_events
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS target_role text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;