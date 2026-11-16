-- Exam submissions: pupils may only write their own answers; scoring happens server-side via submit_exam()
REVOKE INSERT, UPDATE, DELETE ON public.exam_submissions FROM authenticated;
GRANT INSERT (exam_id, student_id, answers) ON public.exam_submissions TO authenticated;
GRANT UPDATE (answers) ON public.exam_submissions TO authenticated;

-- Assignment submissions: pupils write their own work; score/feedback stay staff-controlled
REVOKE INSERT, UPDATE, DELETE ON public.assignment_submissions FROM authenticated;
GRANT INSERT (assignment_id, student_id, content, file_url) ON public.assignment_submissions TO authenticated;
GRANT UPDATE (content, file_url, status, submitted_at) ON public.assignment_submissions TO authenticated;

-- Certificates: only administrators can issue, edit or delete certificates
DROP POLICY IF EXISTS "staff manage" ON public.certificates;
CREATE POLICY "admin manage certificates" ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Exams: staff see everything; pupils and parents only see active and upcoming papers
DROP POLICY IF EXISTS "read all signed in" ON public.exams;
CREATE POLICY "exams read" ON public.exams FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR status IN ('active', 'draft'));

-- Transport routes: staff, the assigned driver, and parents of pupils linked to the route
DROP POLICY IF EXISTS "read all signed in" ON public.transport_routes;
CREATE POLICY "transport routes read" ON public.transport_routes FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.transport_driver_profiles p
      WHERE p.user_id = auth.uid() AND p.route_id = transport_routes.id
    )
    OR EXISTS (
      SELECT 1 FROM public.transport_student_links l
      WHERE l.route_id = transport_routes.id AND l.parent_user_id = auth.uid() AND l.active
    )
  );

-- Shared school data: readable by every signed-in portal user, now expressed as an explicit predicate
DROP POLICY IF EXISTS "read all signed in" ON public.academic_resources;
CREATE POLICY "read all signed in" ON public.academic_resources FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.announcements;
CREATE POLICY "read all signed in" ON public.announcements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.assignments;
CREATE POLICY "read all signed in" ON public.assignments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.class_subjects;
CREATE POLICY "read all signed in" ON public.class_subjects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.classes;
CREATE POLICY "read all signed in" ON public.classes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.fee_items;
CREATE POLICY "read all signed in" ON public.fee_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.forum_posts;
CREATE POLICY "read all signed in" ON public.forum_posts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.forum_replies;
CREATE POLICY "read all signed in" ON public.forum_replies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.library_books;
CREATE POLICY "read all signed in" ON public.library_books FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.programmes;
CREATE POLICY "read all signed in" ON public.programmes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.schedules;
CREATE POLICY "read all signed in" ON public.schedules FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.school_events;
CREATE POLICY "read all signed in" ON public.school_events FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.subjects;
CREATE POLICY "read all signed in" ON public.subjects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.terms;
CREATE POLICY "read all signed in" ON public.terms FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.wall_posts;
CREATE POLICY "read all signed in" ON public.wall_posts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.wall_comments;
CREATE POLICY "read all signed in" ON public.wall_comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "read all signed in" ON public.wall_reactions;
CREATE POLICY "read all signed in" ON public.wall_reactions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "teachers directory read" ON public.teachers;
CREATE POLICY "teachers directory read" ON public.teachers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);