-- Admins manage every class timetable; class teachers manage only their own class.
DROP POLICY IF EXISTS "admin manage schedules" ON public.schedules;
CREATE POLICY "admin manage schedules" ON public.schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "class teacher manage schedules" ON public.schedules;
CREATE POLICY "class teacher manage schedules" ON public.schedules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c JOIN public.teachers t ON t.id = c.class_teacher_id WHERE c.id = schedules.class_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c JOIN public.teachers t ON t.id = c.class_teacher_id WHERE c.id = schedules.class_id AND t.user_id = auth.uid()));
