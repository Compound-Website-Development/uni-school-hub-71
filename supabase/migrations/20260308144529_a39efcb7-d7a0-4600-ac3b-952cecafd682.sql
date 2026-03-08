
-- Fix overly permissive INSERT policy on activity_logs
DROP POLICY "System can insert activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Fix announcements - tighten the SELECT
DROP POLICY "Anyone authenticated can view published announcements" ON public.announcements;
CREATE POLICY "Authenticated users can view published announcements" ON public.announcements
FOR SELECT TO authenticated USING (is_published = true);
