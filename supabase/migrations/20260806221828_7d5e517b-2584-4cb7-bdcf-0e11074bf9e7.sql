
CREATE POLICY "student_photos_public_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'student-photos');
CREATE POLICY "student_photos_staff_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "student_photos_staff_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-photos' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'student-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "student_photos_staff_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-photos' AND public.is_staff(auth.uid()));
