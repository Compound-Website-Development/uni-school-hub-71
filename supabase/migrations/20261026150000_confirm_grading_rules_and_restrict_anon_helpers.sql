-- Tighten anonymous access to internal authorization helpers.
-- Token-based public student profile/results RPCs are intentionally unchanged.
REVOKE EXECUTE ON FUNCTION public.can_manage_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.send_message_to_admin(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.teaches_class(uuid, uuid) FROM anon;

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
