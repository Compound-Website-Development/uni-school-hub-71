
-- Add parent to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'parent';

-- Assignments
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  class_id uuid REFERENCES public.classes(id),
  subject_id uuid REFERENCES public.subjects(id),
  due_date timestamptz NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage assignments" ON public.assignments FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view assignments" ON public.assignments FOR SELECT USING (true);

-- Assignment Submissions
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) NOT NULL,
  content text,
  grade numeric,
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage submissions" ON public.assignment_submissions FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can manage own submissions" ON public.assignment_submissions FOR ALL USING (student_id = get_student_id(auth.uid()));

-- Parent Student Links
CREATE TABLE public.parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_user_id, student_id)
);
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view own links" ON public.parent_student_links FOR SELECT USING (parent_user_id = auth.uid());
CREATE POLICY "Admins can manage links" ON public.parent_student_links FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Lesson Plans
CREATE TABLE public.lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.teachers(id),
  class_id uuid REFERENCES public.classes(id),
  subject_id uuid REFERENCES public.subjects(id),
  date date NOT NULL,
  topic text NOT NULL,
  objectives text,
  activities text,
  resources text,
  homework_assigned text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage lesson plans" ON public.lesson_plans FOR ALL USING (is_staff(auth.uid()));

-- School Events
CREATE TABLE public.school_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_type text DEFAULT 'general',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.school_events FOR SELECT USING (true);
CREATE POLICY "Staff can manage events" ON public.school_events FOR ALL USING (is_staff(auth.uid()));

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  subject text,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING (receiver_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Forum Posts
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id),
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view forum posts" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

-- Forum Replies
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view replies" ON public.forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create replies" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

-- Library Books
CREATE TABLE public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  isbn text,
  quantity integer DEFAULT 1,
  available integer DEFAULT 1,
  category text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view books" ON public.library_books FOR SELECT USING (true);
CREATE POLICY "Admins can manage books" ON public.library_books FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Book Issues
CREATE TABLE public.book_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES public.library_books(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) NOT NULL,
  issue_date date DEFAULT CURRENT_DATE,
  return_date date,
  status text DEFAULT 'issued',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.book_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage book issues" ON public.book_issues FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view own issues" ON public.book_issues FOR SELECT USING (student_id = get_student_id(auth.uid()));

-- Transport Routes
CREATE TABLE public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pickup_points text,
  driver_name text,
  driver_phone text,
  vehicle_number text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view routes" ON public.transport_routes FOR SELECT USING (true);
CREATE POLICY "Admins can manage routes" ON public.transport_routes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Student Transport
CREATE TABLE public.student_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) NOT NULL,
  route_id uuid REFERENCES public.transport_routes(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id)
);
ALTER TABLE public.student_transport ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage transport" ON public.student_transport FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view own transport" ON public.student_transport FOR SELECT USING (student_id = get_student_id(auth.uid()));

-- Leave Requests
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.teachers(id) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view own leaves" ON public.leave_requests FOR SELECT USING (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()) OR is_staff(auth.uid())
);
CREATE POLICY "Staff can create leaves" ON public.leave_requests FOR INSERT WITH CHECK (
  teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage leaves" ON public.leave_requests FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Visitor Log
CREATE TABLE public.visitor_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  purpose text NOT NULL,
  person_to_meet text,
  check_in timestamptz DEFAULT now(),
  check_out timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.visitor_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage visitors" ON public.visitor_log FOR ALL USING (is_staff(auth.uid()));

-- Complaints
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'normal',
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage complaints" ON public.complaints FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Health Records
CREATE TABLE public.health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL UNIQUE,
  blood_group text,
  allergies text,
  medical_conditions text,
  emergency_contact text,
  emergency_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage health records" ON public.health_records FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view own health" ON public.health_records FOR SELECT USING (student_id = get_student_id(auth.uid()));

-- Certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) NOT NULL,
  type text NOT NULL,
  issued_date date DEFAULT CURRENT_DATE,
  serial_number text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage certificates" ON public.certificates FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view own certificates" ON public.certificates FOR SELECT USING (student_id = get_student_id(auth.uid()));
