-- Create attendance table for tracking student attendance
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES public.teachers(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Teachers can mark and view attendance for their classes
CREATE POLICY "Teachers can view attendance"
ON public.attendance
FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Teachers can insert attendance"
ON public.attendance
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Teachers can update attendance"
ON public.attendance
FOR UPDATE
USING (is_staff(auth.uid()));

-- Students can view their own attendance
CREATE POLICY "Students can view their own attendance"
ON public.attendance
FOR SELECT
USING (student_id = get_student_id(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();