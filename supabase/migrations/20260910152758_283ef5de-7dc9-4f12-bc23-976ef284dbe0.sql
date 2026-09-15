CREATE OR REPLACE FUNCTION public.compute_grade_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  t numeric;
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
      WHEN t >= 80 THEN 'Excellent'
      WHEN t >= 70 THEN 'Very Good'
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