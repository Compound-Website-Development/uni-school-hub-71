ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS generated_student_id text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.visitor_log RENAME COLUMN person_to_see TO person_to_meet;

ALTER TABLE public.behavioral_records ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS marked_by uuid;
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS grade_level integer,
  ADD COLUMN IF NOT EXISTS school_type text,
  ADD COLUMN IF NOT EXISTS specialization text;
ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS term_number integer;