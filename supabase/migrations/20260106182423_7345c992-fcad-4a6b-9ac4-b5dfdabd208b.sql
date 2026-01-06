-- Phase 1: Database Schema Updates for Gambian School Structure

-- 1.0 First drop the restrictive check constraint on grade_level
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_grade_level_check;

-- Add new constraint allowing grades 7-12
ALTER TABLE public.classes ADD CONSTRAINT classes_grade_level_check CHECK (grade_level >= 7 AND grade_level <= 12);

-- 1.1 Add school_type column to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS school_type TEXT CHECK (school_type IN ('upper_basic', 'senior_secondary'));

-- 1.2 Add specialization column for senior secondary (Commerce, Agric, Technical, Home Science, Arts)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS specialization TEXT;

-- 1.3 Create admin_permissions table for managing admin privileges
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_add_admins BOOLEAN DEFAULT false,
  can_manage_students BOOLEAN DEFAULT true,
  can_upload_bulk_data BOOLEAN DEFAULT true,
  can_approve_grades BOOLEAN DEFAULT true,
  can_manage_teachers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS on admin_permissions
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_permissions
CREATE POLICY "Admins can view all permissions"
ON public.admin_permissions FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Super admins can manage permissions"
ON public.admin_permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_permissions ap
    WHERE ap.user_id = auth.uid() AND ap.can_add_admins = true
  )
);

-- 1.4 Clear existing classes and insert proper Gambian school structure
DELETE FROM public.classes;

-- Get or create the current academic year
INSERT INTO public.academic_years (name, start_date, end_date, is_current)
SELECT '2025/2026', '2025-09-01', '2026-07-31', true
WHERE NOT EXISTS (SELECT 1 FROM public.academic_years WHERE is_current = true);

-- Insert Upper Basic School Classes (Grade 7-9, Sections A-G)
WITH current_year AS (SELECT id FROM public.academic_years WHERE is_current = true LIMIT 1)
INSERT INTO public.classes (name, grade_level, section, school_type, academic_year_id)
SELECT 
  'Grade ' || grade || section AS name,
  grade,
  section,
  'upper_basic',
  current_year.id
FROM 
  current_year,
  generate_series(7, 9) AS grade,
  unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G']) AS section;

-- Insert Senior Secondary School Classes (Grade 10-12 with specializations)
WITH current_year AS (SELECT id FROM public.academic_years WHERE is_current = true LIMIT 1)
INSERT INTO public.classes (name, grade_level, section, school_type, specialization, academic_year_id)
SELECT 
  grade || ' ' || spec AS name,
  grade,
  spec,
  'senior_secondary',
  spec,
  current_year.id
FROM 
  current_year,
  generate_series(10, 12) AS grade,
  unnest(ARRAY['Commerce', 'Agric', 'Technical', 'Home Science', 'Arts']) AS spec;

-- 1.5 Clear and insert proper subjects
DELETE FROM public.subjects;

-- Insert Upper Basic subjects (no programme association)
INSERT INTO public.subjects (name, code) VALUES
('English', 'ENG'),
('Mathematics', 'MATH'),
('Integrated Science', 'ISCI'),
('S.E.S', 'SES'),
('Religious Education (IRK or CRE)', 'RE'),
('Agricultural Science', 'AGRI'),
('French', 'FRE'),
('PHE', 'PHE'),
('Literature in English', 'LIT'),
('Computer Studies/ICT', 'ICT'),
('Home Science', 'HSCI'),
('Art and Craft', 'ART'),
('Woodwork', 'WOOD'),
('Technical Drawing', 'TD'),
('Economics', 'ECON');

-- Insert Senior Secondary additional subjects
INSERT INTO public.subjects (name, code) VALUES
('General Science', 'GSCI'),
('Biology', 'BIO'),
('Chemistry', 'CHEM'),
('Physics', 'PHY'),
('Further Mathematics', 'FMATH'),
('Government', 'GOV'),
('Geography', 'GEO'),
('History', 'HIST'),
('Accounting', 'ACC'),
('Commerce', 'COM'),
('Business Management', 'BMAN'),
('Food and Nutrition', 'FN'),
('Music', 'MUS'),
('Arabic', 'ARA'),
('Visual Art', 'VART');

-- 1.6 Update programmes table
DELETE FROM public.programmes;
INSERT INTO public.programmes (name, description) VALUES
('Commerce', 'Focus on Accounting, Commerce, Business Management, and Economics'),
('Agric', 'Focus on Agricultural Science, Biology, and related subjects'),
('Technical', 'Focus on Technical Drawing, Woodwork, Physics, and Mathematics'),
('Home Science', 'Focus on Home Science, Food and Nutrition, and related subjects'),
('Arts', 'Focus on History, Literature, Government, Geography, and Social Sciences');

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_school_type ON public.classes (school_type);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON public.classes (grade_level);