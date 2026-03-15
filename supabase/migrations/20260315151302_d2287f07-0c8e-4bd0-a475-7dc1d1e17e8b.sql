-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: auto-create notifications when announcements are published
CREATE OR REPLACE FUNCTION public.notify_on_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_published = true THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT ur.user_id,
           '📢 ' || NEW.title,
           LEFT(NEW.body, 100),
           'announcement',
           '/student/announcements'
    FROM public.user_roles ur
    WHERE (NEW.target_role = 'all' OR ur.role::text = NEW.target_role)
      AND ur.user_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_announcement
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_announcement();

-- Trigger: notify students when grades are approved
CREATE OR REPLACE FUNCTION public.notify_on_grade_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT s.user_id,
           '📊 Grade Published',
           'Your grade for a subject has been approved. Check your results.',
           'grade',
           '/student/grades'
    FROM public.students s
    WHERE s.id = NEW.student_id AND s.user_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_grade_approved
  AFTER UPDATE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_grade_approved();

-- Trigger: notify students when assignments are created
CREATE OR REPLACE FUNCTION public.notify_on_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT s.user_id,
         '📝 New Assignment: ' || NEW.title,
         'Due: ' || TO_CHAR(NEW.due_date, 'Mon DD, YYYY'),
         'assignment',
         '/student/homework'
  FROM public.students s
  WHERE s.class_id = NEW.class_id AND s.user_id IS NOT NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_assignment
  AFTER INSERT ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_assignment();