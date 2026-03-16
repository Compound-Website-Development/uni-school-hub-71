
-- Behavioral/Discipline Records
CREATE TABLE public.behavioral_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  recorded_by UUID,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'minor',
  description TEXT NOT NULL,
  action_taken TEXT,
  parent_notified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.behavioral_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage behavioral records" ON public.behavioral_records FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view own behavioral records" ON public.behavioral_records FOR SELECT USING (student_id = get_student_id(auth.uid()));

-- Counseling Sessions
CREATE TABLE public.counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  counselor_id UUID,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type TEXT NOT NULL DEFAULT 'individual',
  reason TEXT NOT NULL,
  notes TEXT,
  follow_up_date DATE,
  status TEXT DEFAULT 'scheduled',
  is_confidential BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage counseling sessions" ON public.counseling_sessions FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view own sessions" ON public.counseling_sessions FOR SELECT USING (student_id = get_student_id(auth.uid()));

-- Inventory/Asset Management
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  quantity INTEGER NOT NULL DEFAULT 1,
  available INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  condition TEXT DEFAULT 'good',
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC DEFAULT 0,
  assigned_to TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view inventory" ON public.inventory_items FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage inventory" ON public.inventory_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Academic Resources / LMS Content
CREATE TABLE public.academic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'document',
  subject_id UUID REFERENCES public.subjects(id),
  class_id UUID REFERENCES public.classes(id),
  uploaded_by UUID,
  file_url TEXT,
  external_link TEXT,
  is_published BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.academic_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage resources" ON public.academic_resources FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Anyone can view published resources" ON public.academic_resources FOR SELECT USING (is_published = true);

-- Fee Reminders
CREATE TABLE public.fee_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_item_id UUID REFERENCES public.fee_items(id),
  reminder_type TEXT DEFAULT 'email',
  sent_at TIMESTAMPTZ DEFAULT now(),
  message TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fee_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage reminders" ON public.fee_reminders FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Students can view own reminders" ON public.fee_reminders FOR SELECT USING (student_id = get_student_id(auth.uid()));

-- Timetable Substitutions
CREATE TABLE public.substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  original_teacher_id UUID REFERENCES public.teachers(id),
  substitute_teacher_id UUID REFERENCES public.teachers(id),
  date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view substitutions" ON public.substitutions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage substitutions" ON public.substitutions FOR ALL USING (has_role(auth.uid(), 'admin'));
