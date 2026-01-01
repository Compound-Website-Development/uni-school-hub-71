-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is staff (teacher or admin)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('teacher', 'admin')
  )
$$;

-- Create function to get student_id from user_id
CREATE OR REPLACE FUNCTION public.get_student_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Academic years policies (public read)
CREATE POLICY "Anyone can view academic years" ON public.academic_years
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage academic years" ON public.academic_years
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Terms policies
CREATE POLICY "Anyone can view terms" ON public.terms
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage terms" ON public.terms
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Classes policies
CREATE POLICY "Anyone can view classes" ON public.classes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Programmes policies
CREATE POLICY "Anyone can view programmes" ON public.programmes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage programmes" ON public.programmes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Subjects policies
CREATE POLICY "Anyone can view subjects" ON public.subjects
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Students policies
CREATE POLICY "Students can view their own record" ON public.students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view all students" ON public.students
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Teachers policies
CREATE POLICY "Teachers can view their own record" ON public.teachers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view all teachers" ON public.teachers
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Class subjects policies
CREATE POLICY "Anyone can view class subjects" ON public.class_subjects
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage class subjects" ON public.class_subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Grades policies
CREATE POLICY "Students can view their own grades" ON public.grades
  FOR SELECT USING (student_id = public.get_student_id(auth.uid()));

CREATE POLICY "Staff can view all grades" ON public.grades
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert grades" ON public.grades
  FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update grades" ON public.grades
  FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can delete grades" ON public.grades
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Term results policies
CREATE POLICY "Students can view their published results" ON public.term_results
  FOR SELECT USING (student_id = public.get_student_id(auth.uid()) AND is_published = true);

CREATE POLICY "Staff can view all term results" ON public.term_results
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage term results" ON public.term_results
  FOR ALL USING (public.is_staff(auth.uid()));

-- Applications policies (public can submit)
CREATE POLICY "Anyone can submit applications" ON public.applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view all applications" ON public.applications
  FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update applications" ON public.applications
  FOR UPDATE USING (public.is_staff(auth.uid()));

-- Create function to auto-generate application ID
CREATE OR REPLACE FUNCTION public.generate_application_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.application_id := 'APP-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_application_id
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  WHEN (NEW.application_id IS NULL)
  EXECUTE FUNCTION public.generate_application_id();

-- Create function to calculate total score
CREATE OR REPLACE FUNCTION public.calculate_grade_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_score := COALESCE(NEW.continuous_assessment, 0) + COALESCE(NEW.exam_score, 0);
  
  IF NEW.total_score >= 80 THEN NEW.letter_grade := 'A';
  ELSIF NEW.total_score >= 75 THEN NEW.letter_grade := 'A-';
  ELSIF NEW.total_score >= 70 THEN NEW.letter_grade := 'B+';
  ELSIF NEW.total_score >= 65 THEN NEW.letter_grade := 'B';
  ELSIF NEW.total_score >= 60 THEN NEW.letter_grade := 'B-';
  ELSIF NEW.total_score >= 55 THEN NEW.letter_grade := 'C+';
  ELSIF NEW.total_score >= 50 THEN NEW.letter_grade := 'C';
  ELSIF NEW.total_score >= 45 THEN NEW.letter_grade := 'C-';
  ELSIF NEW.total_score >= 40 THEN NEW.letter_grade := 'D';
  ELSE NEW.letter_grade := 'F';
  END IF;
  
  CASE NEW.letter_grade
    WHEN 'A', 'A-' THEN NEW.remark := 'EXCELLENT';
    WHEN 'B+', 'B', 'B-' THEN NEW.remark := 'VERY GOOD';
    WHEN 'C+', 'C', 'C-' THEN NEW.remark := 'SATISFACTORY';
    WHEN 'D' THEN NEW.remark := 'PASS';
    ELSE NEW.remark := 'FAIL';
  END CASE;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_grade_on_change
  BEFORE INSERT OR UPDATE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_grade_fields();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_term_results_updated_at BEFORE UPDATE ON public.term_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create handle_new_user function for auto profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();