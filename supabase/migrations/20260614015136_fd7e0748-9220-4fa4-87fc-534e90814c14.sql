
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_student_id TEXT;
  user_role_value TEXT;
BEGIN
  user_role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student');

  -- Only allow known roles; default unknowns to student to avoid enum errors
  IF user_role_value NOT IN ('student','teacher','admin','parent') THEN
    user_role_value := 'student';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_value::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF user_role_value = 'student' THEN
    new_student_id := 'STU-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    INSERT INTO public.students (user_id, student_id, first_name, last_name, email, status)
    VALUES (
      NEW.id, new_student_id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email, 'active'
    )
    ON CONFLICT DO NOTHING;
  ELSIF user_role_value IN ('teacher','admin') THEN
    INSERT INTO public.teachers (user_id, employee_id, first_name, last_name, email, status)
    VALUES (
      NEW.id,
      'EMP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email, 'active'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  -- parents: role row only; profile row is created by handle_new_user()

  RETURN NEW;
END;
$function$;
