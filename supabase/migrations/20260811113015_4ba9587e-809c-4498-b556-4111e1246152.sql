
-- 1. Report card persistence fields
ALTER TABLE public.term_results
  ADD COLUMN IF NOT EXISTS affective jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS psychomotor jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS times_opened integer,
  ADD COLUMN IF NOT EXISTS times_present integer,
  ADD COLUMN IF NOT EXISTS next_term_begins date;

CREATE UNIQUE INDEX IF NOT EXISTS term_results_student_term_key
  ON public.term_results (student_id, term_id);

CREATE UNIQUE INDEX IF NOT EXISTS grades_student_subject_term_key
  ON public.grades (student_id, subject_id, term_id);

-- 2. Teacher scoping helpers
CREATE OR REPLACE FUNCTION public.teaches_class(_user_id uuid, _class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _class_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.user_id = _user_id AND (
      EXISTS (SELECT 1 FROM public.class_subjects cs WHERE cs.teacher_id = t.id AND cs.class_id = _class_id)
      OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = _class_id AND c.class_teacher_id = t.id)
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = _student_id AND public.teaches_class(auth.uid(), s.class_id)
      )
$$;

CREATE OR REPLACE FUNCTION public.can_view_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_manage_student(_student_id)
      OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = _student_id AND s.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.parent_student_links l WHERE l.student_id = _student_id AND l.parent_user_id = auth.uid())
$$;

REVOKE EXECUTE ON FUNCTION public.teaches_class(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_student(uuid) FROM anon;

-- students
DROP POLICY IF EXISTS "own student read" ON public.students;
CREATE POLICY "own student read" ON public.students FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.teaches_class(auth.uid(), class_id)
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.parent_student_links l WHERE l.student_id = students.id AND l.parent_user_id = auth.uid())
);

DROP POLICY IF EXISTS "own student update" ON public.students;
CREATE POLICY "own student update" ON public.students FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.teaches_class(auth.uid(), class_id)
  OR user_id = auth.uid()
);

-- grades / attendance / term_results scoped to the teacher's classes
DROP POLICY IF EXISTS "staff manage" ON public.grades;
CREATE POLICY "staff manage" ON public.grades FOR ALL TO authenticated
USING (public.can_manage_student(student_id)) WITH CHECK (public.can_manage_student(student_id));

DROP POLICY IF EXISTS "staff manage" ON public.attendance;
CREATE POLICY "staff manage" ON public.attendance FOR ALL TO authenticated
USING (public.can_manage_student(student_id)) WITH CHECK (public.can_manage_student(student_id));

DROP POLICY IF EXISTS "staff manage" ON public.term_results;
CREATE POLICY "staff manage" ON public.term_results FOR ALL TO authenticated
USING (public.can_manage_student(student_id)) WITH CHECK (public.can_manage_student(student_id));

-- 3. Bursar permission set
CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE allowed boolean;
BEGIN
  IF NOT public.has_role(_user_id, 'admin') THEN RETURN false; END IF;
  EXECUTE format('SELECT %I FROM public.admin_permissions WHERE user_id = $1', _permission)
    INTO allowed USING _user_id;
  RETURN COALESCE(allowed, true); -- admins without an explicit permission row keep full access
END; $$;

REVOKE EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) FROM anon;

DROP POLICY IF EXISTS "staff manage" ON public.admin_permissions;
CREATE POLICY "admins manage permissions" ON public.admin_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "staff manage" ON public.fee_items;
CREATE POLICY "bursar manage fee items" ON public.fee_items FOR ALL TO authenticated
USING (public.has_admin_permission(auth.uid(), 'can_manage_fees'))
WITH CHECK (public.has_admin_permission(auth.uid(), 'can_manage_fees'));

DROP POLICY IF EXISTS "staff manage" ON public.fee_payments;
CREATE POLICY "bursar manage fee payments" ON public.fee_payments FOR ALL TO authenticated
USING (public.has_admin_permission(auth.uid(), 'can_manage_fees'))
WITH CHECK (public.has_admin_permission(auth.uid(), 'can_manage_fees'));

DROP POLICY IF EXISTS "payment_proofs_staff_update" ON public.payment_proofs;
CREATE POLICY "payment_proofs_staff_update" ON public.payment_proofs FOR UPDATE TO authenticated
USING (public.has_admin_permission(auth.uid(), 'can_manage_fees'))
WITH CHECK (public.has_admin_permission(auth.uid(), 'can_manage_fees'));
