
-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_role TEXT DEFAULT 'all',
  priority TEXT DEFAULT 'normal',
  is_published BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view published announcements" ON public.announcements
FOR SELECT USING (is_published = true);

CREATE POLICY "Staff can manage announcements" ON public.announcements
FOR ALL USING (is_staff(auth.uid()));

-- School settings table (key-value store)
CREATE TABLE public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.school_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.school_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can insert activity logs" ON public.activity_logs
FOR INSERT WITH CHECK (true);

-- Fee items table
CREATE TABLE public.fee_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  class_id UUID REFERENCES public.classes(id),
  term_id UUID REFERENCES public.terms(id),
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fee_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fee items" ON public.fee_items
FOR SELECT USING (true);

CREATE POLICY "Admins can manage fee items" ON public.fee_items
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Fee payments table
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) NOT NULL,
  fee_item_id UUID REFERENCES public.fee_items(id) NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own payments" ON public.fee_payments
FOR SELECT USING (student_id = get_student_id(auth.uid()));

CREATE POLICY "Staff can view all payments" ON public.fee_payments
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage payments" ON public.fee_payments
FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Insert default school settings
INSERT INTO public.school_settings (key, value, description) VALUES
  ('school_name', 'Nigerian Private Schools', 'School display name'),
  ('auto_approve_registration', 'false', 'Auto-approve new user registrations'),
  ('current_session', '2024/2025', 'Current academic session'),
  ('grading_scale', 'standard', 'Grading scale type'),
  ('school_email', 'info@nigeriaprivateschools.com', 'School contact email'),
  ('school_phone', '+234 800 000 0000', 'School phone number'),
  ('school_address', 'Lagos, Nigeria', 'School address');

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
