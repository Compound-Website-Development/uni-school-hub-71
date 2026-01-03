-- Create schedules table for class timetables
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Anyone can view schedules
CREATE POLICY "Anyone can view schedules"
ON public.schedules
FOR SELECT
USING (true);

-- Admins can manage schedules
CREATE POLICY "Admins can manage schedules"
ON public.schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create index for efficient queries
CREATE INDEX idx_schedules_class_day ON public.schedules(class_id, day_of_week);
CREATE INDEX idx_schedules_teacher ON public.schedules(teacher_id);