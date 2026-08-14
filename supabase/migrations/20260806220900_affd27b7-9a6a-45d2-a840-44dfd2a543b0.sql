
-- 1. Students: new fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_id text,
  ADD COLUMN IF NOT EXISTS parent_code text,
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS students_parent_id_key ON public.students (parent_id) WHERE parent_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_public_token_key ON public.students (public_token);

-- Backfill parent ids / codes
UPDATE public.students
SET parent_id = 'IMS-P-' || upper(substr(md5(id::text), 1, 6)),
    parent_code = upper(substr(md5(id::text || 'code'), 1, 6))
WHERE parent_id IS NULL;

-- 2. Staff attendance (clock in / out)
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  user_id uuid,
  date date NOT NULL DEFAULT current_date,
  clock_in timestamptz,
  clock_out timestamptz,
  is_late boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_attendance TO authenticated;
GRANT ALL ON public.staff_attendance TO service_role;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_attendance_read" ON public.staff_attendance FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_attendance_own_write" ON public.staff_attendance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff_attendance_own_update" ON public.staff_attendance FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.staff_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Payment proofs
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  uploaded_by uuid,
  fee_item_id uuid REFERENCES public.fee_items(id) ON DELETE SET NULL,
  amount numeric,
  reference text,
  file_url text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_proofs TO authenticated;
GRANT ALL ON public.payment_proofs TO service_role;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_proofs_read" ON public.payment_proofs FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));
CREATE POLICY "payment_proofs_insert" ON public.payment_proofs FOR INSERT TO authenticated
  WITH CHECK (public.can_view_student(student_id) AND uploaded_by = auth.uid());
CREATE POLICY "payment_proofs_staff_update" ON public.payment_proofs FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payment_proofs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Public QR profile lookup (no contact details)
CREATE OR REPLACE FUNCTION public.public_student_profile(_token uuid)
RETURNS TABLE (
  full_name text,
  admission_no text,
  class_name text,
  photo_url text,
  status text,
  attendance_present integer,
  attendance_total integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT trim(concat_ws(' ', s.first_name, s.middle_name, s.last_name)),
         s.student_id,
         c.name,
         s.photo_url,
         s.status,
         (SELECT count(*)::int FROM public.attendance a WHERE a.student_id = s.id AND a.status = 'present'),
         (SELECT count(*)::int FROM public.attendance a WHERE a.student_id = s.id)
  FROM public.students s
  LEFT JOIN public.classes c ON c.id = s.class_id
  WHERE s.public_token = _token
$$;
GRANT EXECUTE ON FUNCTION public.public_student_profile(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.public_student_results(_token uuid)
RETURNS TABLE (subject text, term text, total_score numeric, letter_grade text, remark text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sub.name, t.name, g.total_score, g.letter_grade, g.remark
  FROM public.students s
  JOIN public.grades g ON g.student_id = s.id
  LEFT JOIN public.subjects sub ON sub.id = g.subject_id
  LEFT JOIN public.terms t ON t.id = g.term_id
  LEFT JOIN public.term_results tr ON tr.student_id = s.id AND tr.term_id = g.term_id
  WHERE s.public_token = _token AND COALESCE(tr.is_published, false) = true
$$;
GRANT EXECUTE ON FUNCTION public.public_student_results(uuid) TO anon, authenticated;
