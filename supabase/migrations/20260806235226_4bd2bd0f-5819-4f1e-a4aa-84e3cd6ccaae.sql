-- profiles
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));

-- teachers: keep directory visibility but hide sensitive columns via column grants
DROP POLICY IF EXISTS "read all signed in" ON public.teachers;
CREATE POLICY "teachers directory read" ON public.teachers FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.teachers FROM authenticated;
GRANT SELECT (id, user_id, employee_id, first_name, last_name, department, qualification, photo_url, status, created_at, updated_at) ON public.teachers TO authenticated;
CREATE OR REPLACE FUNCTION public.staff_teacher_records()
RETURNS SETOF public.teachers LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT t.* FROM public.teachers t WHERE public.is_staff(auth.uid()) OR t.user_id = auth.uid()
$$;
REVOKE ALL ON FUNCTION public.staff_teacher_records() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_teacher_records() TO authenticated;

-- exam questions: staff only, students use safe RPC
DROP POLICY IF EXISTS "read all signed in" ON public.exam_questions;
CREATE POLICY "staff read questions" ON public.exam_questions FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));
CREATE OR REPLACE FUNCTION public.student_exam_questions(_exam_id uuid)
RETURNS TABLE(id uuid, exam_id uuid, question_text text, options jsonb, points numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT q.id, q.exam_id, q.question_text, q.options, q.points
  FROM public.exam_questions q
  JOIN public.exams e ON e.id = q.exam_id
  WHERE q.exam_id = _exam_id AND e.is_published = true
$$;
REVOKE ALL ON FUNCTION public.student_exam_questions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_exam_questions(uuid) TO authenticated;

-- certificates
DROP POLICY IF EXISTS "scoped read" ON public.certificates;
CREATE POLICY "scoped read" ON public.certificates FOR SELECT TO authenticated
USING (public.can_view_student(student_id));

-- school settings
DROP POLICY IF EXISTS "read settings" ON public.school_settings;
CREATE POLICY "read settings" ON public.school_settings FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

-- activity logs
DROP POLICY IF EXISTS "write logs" ON public.activity_logs;
CREATE POLICY "write logs" ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK ((user_id = auth.uid()) OR public.is_staff(auth.uid()));

-- storage
DROP POLICY IF EXISTS "student_photos_public_read" ON storage.objects;
CREATE POLICY "student_photos_staff_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'student-photos' AND public.is_staff(auth.uid()));

-- lock down security definer functions from anonymous callers
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.can_view_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_student(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_grade_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;