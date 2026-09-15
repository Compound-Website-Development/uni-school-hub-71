-- ENUM + core role infra
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student','teacher','admin','parent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  first_name text, last_name text, email text, phone text, address text, avatar_url text, bio text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('teacher','admin'))
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.app_role;
BEGIN
  BEGIN r := COALESCE(NEW.raw_user_meta_data->>'role','student')::public.app_role;
  EXCEPTION WHEN others THEN r := 'student'; END;
  INSERT INTO public.profiles (user_id, first_name, last_name, email, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name', NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ACADEMIC STRUCTURE
CREATE TABLE public.programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, employee_id text UNIQUE,
  first_name text NOT NULL, last_name text NOT NULL, email text, phone text, address text, bio text,
  department text, qualification text, date_of_birth date, gender text, photo_url text,
  status text NOT NULL DEFAULT 'active', hire_date date,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, level text, arm text, room text,
  class_teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL, capacity integer DEFAULT 40,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, session text,
  start_date date, end_date date, is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, student_id text UNIQUE NOT NULL,
  first_name text NOT NULL, last_name text NOT NULL, middle_name text, email text, phone text, address text,
  date_of_birth date, gender text, nationality text, state_of_origin text, religion text, blood_group text,
  bio text, hobbies text, photo_url text, emergency_contact text,
  guardian_name text, guardian_phone text, guardian_email text, guardian_relation text,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL,
  admission_date date DEFAULT CURRENT_DATE, status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), parent_user_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relation text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(parent_user_id, student_id));
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE,
  can_add_admins boolean NOT NULL DEFAULT false, can_manage_students boolean NOT NULL DEFAULT true,
  can_upload_bulk_data boolean NOT NULL DEFAULT true, can_approve_grades boolean NOT NULL DEFAULT true,
  can_manage_teachers boolean NOT NULL DEFAULT false, can_manage_fees boolean NOT NULL DEFAULT false,
  can_view_reports boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());

-- ACADEMIC RECORDS
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE, status text NOT NULL DEFAULT 'present', notes text,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  continuous_assessment numeric, exam_score numeric, total_score numeric, letter_grade text, remark text,
  status text NOT NULL DEFAULT 'draft', entered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.term_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL,
  gpa numeric, average numeric, class_position integer, class_size integer,
  teacher_comment text, principal_comment text, is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  due_date timestamptz, max_score numeric DEFAULT 100, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content text, file_url text, score numeric, feedback text, status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  duration_minutes integer DEFAULT 30, start_time timestamptz, end_time timestamptz,
  is_published boolean NOT NULL DEFAULT false, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text text NOT NULL, options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer, points numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.exam_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb, score numeric, submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(exam_id, student_id));
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  day_of_week integer, start_time time, end_time time, room text,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.schedules(id) ON DELETE CASCADE,
  original_teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  substitute_teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  date date NOT NULL, reason text, status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  date date, topic text, objectives text, activities text, resources text, homework_assigned text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  start_date date NOT NULL, end_date date NOT NULL, reason text, status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.academic_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, file_url text,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT true, uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now());

-- COMMUNICATION
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text,
  target_role text NOT NULL DEFAULT 'all', priority text NOT NULL DEFAULT 'normal',
  is_published boolean NOT NULL DEFAULT true, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL, body text,
  type text DEFAULT 'info', link text, is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL, receiver_id uuid NOT NULL,
  subject text, body text, is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, subject text NOT NULL,
  description text, priority text NOT NULL DEFAULT 'normal', status text NOT NULL DEFAULT 'open',
  response text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL, content text NOT NULL,
  image_url text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.wall_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.wall_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL, content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.wall_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.wall_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, reaction text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(post_id, user_id, reaction));
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL, title text NOT NULL, body text,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.school_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text,
  event_date date NOT NULL, end_date date, location text, category text,
  created_at timestamptz NOT NULL DEFAULT now());

-- OPERATIONS
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_id text UNIQUE NOT NULL,
  first_name text NOT NULL, last_name text NOT NULL, date_of_birth date, gender text, nationality text,
  email text, phone text, address text, village text, previous_school text, last_grade_completed text,
  applying_for_grade integer, programme text, guardian_name text, guardian_relation text,
  guardian_phone text, guardian_email text, status text NOT NULL DEFAULT 'pending', notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  type text NOT NULL, serial_number text UNIQUE NOT NULL, issued_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.fee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, amount numeric NOT NULL DEFAULT 0,
  term_id uuid REFERENCES public.terms(id) ON DELETE SET NULL, class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_item_id uuid REFERENCES public.fee_items(id) ON DELETE SET NULL,
  amount_paid numeric NOT NULL DEFAULT 0, method text, reference text, status text NOT NULL DEFAULT 'paid',
  paid_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, author text, isbn text,
  category text, quantity integer NOT NULL DEFAULT 1, available integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.book_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.library_books(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  issued_on date NOT NULL DEFAULT CURRENT_DATE, due_date date, returned_on date,
  status text NOT NULL DEFAULT 'issued', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category text,
  quantity integer NOT NULL DEFAULT 0, available integer NOT NULL DEFAULT 0, location text,
  condition text, serial_number text, purchase_date date, purchase_cost numeric DEFAULT 0, notes text,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, pickup_points text,
  driver_name text, driver_phone text, vehicle_number text,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.visitor_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, phone text, purpose text,
  person_to_see text, check_in timestamptz NOT NULL DEFAULT now(), check_out timestamptz,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.counseling_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  session_type text, reason text, notes text, session_date date NOT NULL DEFAULT CURRENT_DATE,
  follow_up_date date, status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.behavioral_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  category text, severity text, description text, action_taken text,
  recorded_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text UNIQUE NOT NULL, value text, updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, action text NOT NULL, entity text,
  entity_id text, details text, created_at timestamptz NOT NULL DEFAULT now());

-- grade auto-calculation
CREATE OR REPLACE FUNCTION public.compute_grade_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE t numeric;
BEGIN
  t := COALESCE(NEW.continuous_assessment,0) + COALESCE(NEW.exam_score,0);
  NEW.total_score := t;
  NEW.letter_grade := CASE WHEN t >= 90 THEN 'A' WHEN t >= 80 THEN 'B' WHEN t >= 70 THEN 'C'
                           WHEN t >= 60 THEN 'D' WHEN t >= 50 THEN 'E' ELSE 'F' END;
  NEW.remark := CASE WHEN t >= 90 THEN 'Outstanding' WHEN t >= 80 THEN 'Excellent'
                     WHEN t >= 70 THEN 'Very Good' WHEN t >= 60 THEN 'Very Good'
                     WHEN t >= 50 THEN 'Good' WHEN t >= 40 THEN 'Fair' ELSE 'Poor' END;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER grades_compute BEFORE INSERT OR UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.compute_grade_fields();

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname='updated_at'
           WHERE n.nspname='public' AND c.relkind='r' AND c.relname <> 'grades'
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

-- helper: does current user own this student record (as student or linked parent)
CREATE OR REPLACE FUNCTION public.can_view_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff(auth.uid())
      OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = _student_id AND s.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.parent_student_links l WHERE l.student_id = _student_id AND l.parent_user_id = auth.uid())
$$;

-- GRANTS + RLS for the rest
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r' AND c.relname NOT IN ('profiles','user_roles')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- shared reference data: readable by any signed-in user, managed by staff
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['programmes','subjects','classes','class_subjects','terms','teachers','schedules',
    'announcements','school_events','library_books','academic_resources','assignments','exams','exam_questions',
    'forum_posts','forum_replies','wall_posts','wall_comments','wall_reactions','fee_items','transport_routes']
  LOOP
    EXECUTE format('CREATE POLICY "read all signed in" ON public.%I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['programmes','subjects','classes','class_subjects','terms','teachers','schedules',
    'announcements','school_events','library_books','academic_resources','assignments','exams','exam_questions',
    'fee_items','transport_routes','inventory_items','visitor_log','substitutions','certificates','activity_logs',
    'school_settings','counseling_sessions','behavioral_records','book_issues','fee_payments','attendance',
    'grades','term_results','applications','admin_permissions','parent_student_links','lesson_plans','leave_requests']
  LOOP
    EXECUTE format('CREATE POLICY "staff manage" ON public.%I FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t);
  END LOOP;
END $$;

-- student/parent scoped reads
CREATE POLICY "own student read" ON public.students FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.parent_student_links l WHERE l.student_id = students.id AND l.parent_user_id = auth.uid()));
CREATE POLICY "own student update" ON public.students FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "staff insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff delete students" ON public.students FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "scoped read" ON public.attendance FOR SELECT TO authenticated USING (public.can_view_student(student_id));
CREATE POLICY "scoped read" ON public.grades FOR SELECT TO authenticated USING (public.can_view_student(student_id));
CREATE POLICY "scoped read" ON public.term_results FOR SELECT TO authenticated USING (public.can_view_student(student_id));
CREATE POLICY "scoped read" ON public.fee_payments FOR SELECT TO authenticated USING (public.can_view_student(student_id));
CREATE POLICY "scoped read" ON public.book_issues FOR SELECT TO authenticated USING (public.can_view_student(student_id));
CREATE POLICY "scoped read" ON public.counseling_sessions FOR SELECT TO authenticated USING (public.can_view_student(student_id));
CREATE POLICY "scoped read" ON public.behavioral_records FOR SELECT TO authenticated USING (public.can_view_student(student_id));
CREATE POLICY "scoped read" ON public.certificates FOR SELECT TO authenticated USING (true);
CREATE POLICY "public verify certificate" ON public.certificates FOR SELECT TO anon USING (true);
GRANT SELECT ON public.certificates TO anon;
GRANT SELECT ON public.students TO anon;
CREATE POLICY "links own read" ON public.parent_student_links FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR parent_user_id = auth.uid());

CREATE POLICY "own submissions" ON public.assignment_submissions FOR ALL TO authenticated
  USING (public.can_view_student(student_id)) WITH CHECK (public.can_view_student(student_id));
CREATE POLICY "own exam submissions" ON public.exam_submissions FOR ALL TO authenticated
  USING (public.can_view_student(student_id)) WITH CHECK (public.can_view_student(student_id));

CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "staff create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "update own messages" ON public.messages FOR UPDATE TO authenticated USING (receiver_id = auth.uid());

CREATE POLICY "own complaints" ON public.complaints FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "create complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff update complaints" ON public.complaints FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- author-owned social content
CREATE POLICY "author write" ON public.wall_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "author delete" ON public.wall_posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "author write" ON public.wall_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "author delete" ON public.wall_comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own reaction" ON public.wall_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own reaction delete" ON public.wall_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "author write" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "author delete" ON public.forum_posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "author write" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "author delete" ON public.forum_replies FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- teacher-owned records
CREATE POLICY "own lesson plans" ON public.lesson_plans FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "own leave" ON public.leave_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- public admissions form
CREATE POLICY "anyone can apply" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON public.applications TO anon;

-- admin-only tables
CREATE POLICY "admin only permissions" ON public.admin_permissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "read settings" ON public.school_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "read logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "write logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "read inventory" ON public.inventory_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "read visitors" ON public.visitor_log FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "read subs" ON public.substitutions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "read applications" ON public.applications FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- backfill profiles + roles for existing users, and make the super admin
INSERT INTO public.profiles (user_id, first_name, last_name, email, phone)
SELECT u.id, u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name', u.email, u.raw_user_meta_data->>'phone'
FROM auth.users u ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, CASE WHEN u.email = 'ayodejiomoniyi673@gmail.com' THEN 'admin'::public.app_role
                  ELSE COALESCE(NULLIF(u.raw_user_meta_data->>'role',''),'student')::public.app_role END
FROM auth.users u ON CONFLICT DO NOTHING;

INSERT INTO public.admin_permissions (user_id, can_add_admins, can_manage_students, can_upload_bulk_data, can_approve_grades, can_manage_teachers, can_manage_fees, can_view_reports)
SELECT u.id, true, true, true, true, true, true, true FROM auth.users u
WHERE u.email = 'ayodejiomoniyi673@gmail.com' ON CONFLICT (user_id) DO UPDATE SET can_add_admins = true;

-- realtime for notifications + wall
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;