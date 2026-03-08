

## Comprehensive Perfection Plan — Nigerian Private Schools Platform

This is a large-scope refinement covering theme polish, missing modules, and functional completeness. I'll break it into phases to implement systematically.

---

### Assessment of Current State

**What exists and works:**
- Admin dashboard with stats, activity logs, quick actions
- Staff dashboard with schedule, grades, attendance
- Student dashboard with GPA, grades, schedule
- Auth flow with role selection (student/staff), login/register
- Database: students, teachers, classes, grades, attendance, fees, announcements, activity_logs, school_settings

**What's missing or incomplete:**
1. **CBT Module** — No exam/question tables or UI
2. **Student Attendance page** — No calendar view for students
3. **Student Fee Payment page** — No student-facing fee view
4. **Student Announcements page** — No announcements feed for students
5. **Password Reset** — "Forgot password?" link is a no-op
6. **Timetable/Schedule** — Student schedule page exists but may use hardcoded data
7. **Admin Grading Scale config** — Settings page is basic
8. **Notification bell** — Icon exists but no dropdown
9. **Theme inconsistencies** — Some pages still use Material Symbols font icons instead of Lucide
10. **"Login As" / Masquerade** — Not implemented
11. **Bulk actions** — Limited in approvals/students pages
12. **Data export** — No CSV/PDF export on admin tables

---

### Phase 1: Theme & UI Polish

**Color refinement:**
- Lighten the sidebar background slightly for a more modern feel
- Ensure all pages use Lucide icons consistently (remove Material Symbols references from StaffDashboard, StaffLayout)
- Standardize card styles: `rounded-xl border-border/50 shadow-card` everywhere
- Fix input focus rings to match primary color
- Add subtle hover animations on all interactive cards

**Files to edit:** `src/index.css`, `src/components/layout/StaffLayout.tsx`, `src/pages/staff/StaffDashboard.tsx`, `src/components/ui/stat-card.tsx`

---

### Phase 2: Missing Student Pages

1. **Student Attendance Page** (`/student/attendance`)
   - Calendar view with color-coded days (present=green, absent=red, holiday=gray)
   - Summary stats: Total Days, Present, Absent, Percentage
   - Fetches from `attendance` table filtered by student

2. **Student Fee Payment Page** (`/student/fees`)
   - Current term fee breakdown table from `fee_items`
   - Payment status badges from `fee_payments`
   - Payment history list
   - "Pay Now" placeholder button

3. **Student Announcements Page** (`/student/announcements`)
   - Card list from `announcements` table where `target_role` is 'all' or 'student'
   - Priority badges, date formatting
   - Unread indicator (green dot)

**New routes in App.tsx, new sidebar items in StudentLayout**

---

### Phase 3: CBT Examination Module

**Database migration — new tables:**
- `exams`: id, title, subject_id, class_id, duration_minutes, start_time, end_time, status (draft/active/completed), created_by, created_at
- `exam_questions`: id, exam_id, question_text, options (jsonb array of 4 strings), correct_index (integer), points (default 1)
- `exam_submissions`: id, exam_id, student_id, answers (jsonb), score, submitted_at, started_at

**RLS:** Staff can manage exams/questions. Students can view active exams and submit answers. Students can view their own submissions.

**Staff CBT pages:**
- `/staff/cbt` — List exams with status badges, "Create Exam" button
- Create/edit exam modal with question builder (add multiple-choice questions)
- View exam results

**Student CBT pages:**
- `/student/exams` — List of available/upcoming exams
- `/student/exams/:id` — Take exam interface (timer, question navigation, submit)
- View past results

---

### Phase 4: Password Reset Flow

1. **Forgot Password component** — modal or inline on login page
   - Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
2. **`/reset-password` page** — form to set new password
   - Checks for recovery token in URL
   - Calls `supabase.auth.updateUser({ password })`

---

### Phase 5: Notification System

- Create `notifications` table: id, user_id, title, body, is_read, type, link, created_at
- Bell icon dropdown in all layouts showing recent unread notifications
- Mark as read on click
- Auto-generate notifications on key events (new announcement, grade published, fee due)

**Database migration + RLS:** Users can only read their own notifications.

---

### Phase 6: Admin Enhancements

1. **Admin Academic Settings** — Manage grading scale, class/subject CRUD in settings tabs
2. **Data Export** — CSV download buttons on Students, Staff, Fees tables
3. **Admin Reports page** — School-wide report generation (term reports, attendance summaries)
4. **Login-As / Masquerade** — Admin can view student/staff dashboards (read-only preview mode using student data)

---

### Phase 7: Staff Module Completions

1. **Staff Reports page** — Generate class reports, term summaries
2. **Staff Profile page** — View/edit own profile
3. **Staff My Students** — Enhanced with filters, search, attendance summary per student

---

### Implementation Order

Given the scope, I'll implement in this order across multiple messages:

1. **Theme polish + icon consistency** (immediate)
2. **Student Attendance, Fees, Announcements pages** (immediate)
3. **CBT database + staff CBT management** (next)
4. **Student exam-taking interface** (next)
5. **Password reset flow** (next)
6. **Notification system** (next)
7. **Admin enhancements + export** (next)

### Database Changes Required

```sql
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
  options jsonb NOT NULL DEFAULT '[]',
  correct_index integer NOT NULL DEFAULT 0,
  points integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.exam_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) NOT NULL,
  student_id uuid REFERENCES public.students(id) NOT NULL,
  answers jsonb DEFAULT '{}',
  score numeric,
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE(exam_id, student_id)
);

-- Notifications Table
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

-- RLS for all new tables
-- Exams: staff manage, students view active
-- Questions: staff manage, students view during exam
-- Submissions: students own, staff view all
-- Notifications: users own only
```

### Files to Create (new pages)

- `src/pages/student/StudentAttendance.tsx`
- `src/pages/student/StudentFees.tsx`
- `src/pages/student/StudentAnnouncements.tsx`
- `src/pages/student/StudentExams.tsx`
- `src/pages/student/TakeExam.tsx`
- `src/pages/staff/StaffCBT.tsx`
- `src/pages/ResetPassword.tsx`
- `src/components/NotificationDropdown.tsx`

### Files to Edit

- `src/App.tsx` — Add new routes
- `src/index.css` — Theme refinements
- `src/components/layout/StudentLayout.tsx` — Add new sidebar items
- `src/components/layout/StaffLayout.tsx` — Add CBT nav item, replace Material Symbols with Lucide
- `src/components/layout/AdminLayout.tsx` — Add notification dropdown
- `src/pages/staff/StaffDashboard.tsx` — Replace Material Symbols with Lucide icons
- `src/pages/Login.tsx` — Wire up forgot password
- `src/pages/admin/AdminSettingsPage.tsx` — Expand with grading scale, class/subject management tabs

This plan delivers a production-grade school management platform with all essential modules functioning end-to-end.

