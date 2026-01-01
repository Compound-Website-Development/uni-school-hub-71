-- Fix function search paths for remaining functions
CREATE OR REPLACE FUNCTION public.generate_application_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.application_id := 'APP-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_grade_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.total_score := COALESCE(NEW.continuous_assessment, 0) + COALESCE(NEW.exam_score, 0);
  
  IF NEW.total_score >= 80 THEN NEW.letter_grade := 'A';
  ELSIF NEW.total_score >= 75 THEN NEW.letter_grade := 'A-';
  ELSIF NEW.total_score >= 70 THEN NEW.letter_grade := 'B+';
  ELSIF NEW.total_score >= 65 THEN NEW.letter_grade := 'B';
  ELSIF NEW.total_score >= 60 THEN NEW.letter_grade := 'B-';
  ELSIF NEW.total_score >= 55 THEN NEW.letter_grade := 'C+';
  ELSIF NEW.total_score >= 50 THEN NEW.letter_grade := 'C';
  ELSIF NEW.total_score >= 45 THEN NEW.letter_grade := 'C-';
  ELSIF NEW.total_score >= 40 THEN NEW.letter_grade := 'D';
  ELSE NEW.letter_grade := 'F';
  END IF;
  
  CASE NEW.letter_grade
    WHEN 'A', 'A-' THEN NEW.remark := 'EXCELLENT';
    WHEN 'B+', 'B', 'B-' THEN NEW.remark := 'VERY GOOD';
    WHEN 'C+', 'C', 'C-' THEN NEW.remark := 'SATISFACTORY';
    WHEN 'D' THEN NEW.remark := 'PASS';
    ELSE NEW.remark := 'FAIL';
  END CASE;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Insert seed data for programmes
INSERT INTO public.programmes (name, description) VALUES
  ('Sciences', 'Science-focused curriculum including Physics, Chemistry, Biology'),
  ('Humanities', 'Arts and social sciences curriculum'),
  ('Commerce', 'Business and economics focused curriculum'),
  ('Arts', 'Creative arts and literature curriculum');

-- Insert academic year
INSERT INTO public.academic_years (name, start_date, end_date, is_current) VALUES
  ('2024/2025', '2024-09-01'::DATE, '2025-07-31'::DATE, true);

-- Insert subjects
INSERT INTO public.subjects (name, code) VALUES
  ('English Language', 'ENG'),
  ('General Mathematics', 'MATH'),
  ('Science', 'SCI'),
  ('Civic Education', 'CIV'),
  ('History', 'HIST'),
  ('Government', 'GOV'),
  ('Islamic Studies', 'ISL'),
  ('Literature-in-English', 'LIT'),
  ('Physical Health Education', 'PHE'),
  ('Geography', 'GEO'),
  ('Economics', 'ECON'),
  ('Accounting', 'ACCT');