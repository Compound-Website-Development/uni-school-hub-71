-- Create a function to handle new user registration
-- This will automatically create a student record and assign the student role
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_student_id TEXT;
  user_role_value TEXT;
BEGIN
  -- Check if user metadata indicates they are registering as staff
  user_role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'student');
  
  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role_value::user_role);
  
  -- If registering as a student, create student record
  IF user_role_value = 'student' THEN
    -- Generate student ID (format: STU-YEAR-XXXXX)
    new_student_id := 'STU-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    
    INSERT INTO public.students (
      user_id,
      student_id,
      first_name,
      last_name,
      email,
      status
    )
    VALUES (
      NEW.id,
      new_student_id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email,
      'active'
    );
  END IF;
  
  -- If registering as teacher/admin, create teacher record
  IF user_role_value = 'teacher' OR user_role_value = 'admin' THEN
    INSERT INTO public.teachers (
      user_id,
      employee_id,
      first_name,
      last_name,
      email,
      status
    )
    VALUES (
      NEW.id,
      'EMP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      NEW.email,
      'active'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run on new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();