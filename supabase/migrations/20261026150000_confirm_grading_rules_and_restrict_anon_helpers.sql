-- Confirmed school grading rules (Otuagoma Joseph, 26 October 2026).
-- Tighten helper RPC access by removing inherited PUBLIC execution.
REVOKE EXECUTE ON FUNCTION public.can_manage_student(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_message_to_admin(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.teaches_class(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message_to_admin(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teaches_class(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.compute_grade_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE t numeric;
BEGIN
  IF NEW.continuous_assessment IS NULL AND NEW.exam_score IS NULL THEN
    NEW.total_score := NULL;
    NEW.letter_grade := NULL;
    NEW.remark := NULL;
  ELSE
    t := COALESCE(NEW.continuous_assessment, 0) + COALESCE(NEW.exam_score, 0);
    NEW.total_score := t;
    NEW.letter_grade := CASE
      WHEN t >= 90 THEN 'A'
      WHEN t >= 80 THEN 'B'
      WHEN t >= 70 THEN 'C'
      WHEN t >= 60 THEN 'D'
      WHEN t >= 50 THEN 'E'
      ELSE 'F'
    END;
    NEW.remark := CASE
      WHEN t >= 90 THEN 'Outstanding'
      WHEN t >= 70 THEN 'Excellent'
      WHEN t >= 60 THEN 'Very Good'
      WHEN t >= 50 THEN 'Good'
      WHEN t >= 40 THEN 'Fair'
      ELSE 'Poor'
    END;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

INSERT INTO public.school_settings (key, value)
VALUES
  ('assessment_ca_weight_percent', '40'),
  ('assessment_exam_weight_percent', '60'),
  ('grade_band_0_39_remark', 'Poor'),
  ('grade_band_40_49_remark', 'Fair'),
  ('grade_band_50_59_remark', 'Good'),
  ('grade_band_60_69_remark', 'Very Good'),
  ('grade_band_70_89_remark', 'Excellent'),
  ('grade_band_90_100_remark', 'Outstanding'),
  ('grading_rules_confirmed_by', 'Otuagoma Joseph'),
  ('grading_rules_confirmed_on', '2026-10-26')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
