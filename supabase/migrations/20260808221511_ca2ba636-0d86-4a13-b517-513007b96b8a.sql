CREATE OR REPLACE FUNCTION public.submit_exam(_submission_id uuid)
RETURNS TABLE(score numeric, total_points numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub public.exam_submissions%ROWTYPE;
  earned numeric := 0;
  total numeric := 0;
  q record;
  ans int;
BEGIN
  SELECT * INTO sub FROM public.exam_submissions WHERE id = _submission_id;
  IF sub.id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF NOT public.can_view_student(sub.student_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF sub.submitted_at IS NOT NULL THEN
    RETURN QUERY SELECT sub.score, NULL::numeric;
    RETURN;
  END IF;

  FOR q IN SELECT id, correct_index, points FROM public.exam_questions WHERE exam_id = sub.exam_id LOOP
    total := total + COALESCE(q.points, 1);
    BEGIN
      ans := (sub.answers ->> q.id::text)::int;
    EXCEPTION WHEN others THEN ans := NULL; END;
    IF ans IS NOT NULL AND q.correct_index IS NOT NULL AND ans = q.correct_index THEN
      earned := earned + COALESCE(q.points, 1);
    END IF;
  END LOOP;

  UPDATE public.exam_submissions
     SET score = earned, submitted_at = now()
   WHERE id = _submission_id;

  RETURN QUERY SELECT earned, total;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_exam(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_exam(uuid) TO authenticated;