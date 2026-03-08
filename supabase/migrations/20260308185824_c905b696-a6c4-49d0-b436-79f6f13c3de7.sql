
-- CBT Tables
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id),
  class_id uuid REFERENCES public.classes(id),
  duration_minutes integer NOT NULL DEFAULT 60,
  start_time timestamptz,
  end_time timestamptz,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  points integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.exam_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) NOT NULL,
  student_id uuid REFERENCES public.students(id) NOT NULL,
  answers jsonb DEFAULT '{}'::jsonb,
  score numeric,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE(exam_id, student_id)
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean DEFAULT false,
  type text DEFAULT 'info',
  link text,
  created_at timestamptz DEFAULT now()
);

-- RLS for exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage exams" ON public.exams FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view active exams" ON public.exams FOR SELECT USING (status = 'active');

-- RLS for exam_questions
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage questions" ON public.exam_questions FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view questions of active exams" ON public.exam_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exams WHERE id = exam_id AND status = 'active')
);

-- RLS for exam_submissions
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view all submissions" ON public.exam_submissions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Students can manage own submissions" ON public.exam_submissions FOR ALL USING (student_id = get_student_id(auth.uid()));

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
