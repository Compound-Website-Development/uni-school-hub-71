# NPS Platform — Pre-Demo Audit, Fix & Soft Redesign

This plan is structured exactly around your 6 steps. Step 1 (feature inventory) and Step 2 (platform explanation) are delivered immediately below as part of the plan itself, so you can review them before any code changes. Steps 3–6 are the implementation work.add the parent dashboard link to the super admin side bar the web app shouldn't look like it was vibe coded their should be no traces of Lovable in the front end or backend or code 

The White theme on the super admin dashboard has an issue I can't view the stuff on the side bar if it's in the white tine the pages all the pages content taken too long to load and the fonts take too long to load they show some weird disoriented stuff before they finally align remove that 

---

## Step 1 — Current Feature Inventory

### Super Admin Portal (`/admin/*`) — 25 modules

**Working**

- Dashboard, Analytics, Activity Logs
- Students, Staff, Users management
- Approvals (admissions queue), Bulk student upload
- Announcements (school-wide), Fees & fee items
- Reports, Library, Transport, Visitors
- ID Cards, Certificates, Complaints
- Inventory, Substitutions, Behavioral, Wellbeing, Settings

**Beta / Half-baked (flagged for Step 3)**

- Predictive Analytics — UI present, AI wiring partial
- Financial Intelligence — AI forecast button wired but lacks empty-state when no fees exist
- Bulk Upload — CSV parse OK, no error report download
- Certificates — verification works, but issuance flow has no "preview before issue"

### Teacher / Staff Portal (`/staff/*`) — 16 modules

**Working**

- Dashboard, Gradebook, Attendance, Classes, Students
- Assignments, Lesson Plans, CBT exam builder
- Messages, Forum, Leave, Reports, Profile, Wall

**Broken / Needs scoping (Step 3)**

- StaffStudents and StaffClasses currently query ALL students/classes instead of only the teacher's assigned classes
- Gradebook lets teacher pick any class (should be filtered by `teachers.user_id` → `classes`)
- Admissions tab is duplicated from admin (should be admin-only or read-only for teachers)

### Student Portal (`/student/*`) — 16 modules

**Working**

- Dashboard, Grades, Reports, Transcript, Schedule, Attendance, Fees
- Exams + Take Exam, Homework, Library, Calendar, Announcements
- Complaints, Resources, Profile, Wall, Settings

**Issues (Step 3)**

- A few pages query by `user.id` directly instead of resolving to `students.id` first → empty data for some students
- Reports page doesn't gate by term-payment-status (memory rule)

### Parent Portal (`/parent/*`) — 8 modules

**Working**

- Dashboard, Grades, Attendance, Fees, Messages, Forum, Profile, Wall

**Issues (Step 3)**

- Parent dashboard reads from `parent_student_links` but several child pages (ParentGrades, ParentAttendance, ParentFees) don't filter by the linked child — risk of leaking other students' data
- No child-switcher UI when a parent has multiple children

---

## Step 2 — How the Platform Works (Principal-friendly explanation)

**Four portals, one login page.** Everyone signs in at `/login`. The system reads their role from the database and sends them to the right portal automatically:

- Students → `/student`
- Teachers → `/staff`
- Parents → `/parent`
- Super Admin (school owner) → `/admin`

**Role-based access.** Each user has exactly one role stored in a protected `user_roles` table. Database-level Row Level Security (RLS) ensures a student cannot read teacher data, a parent cannot read another parent's child, and so on — even if someone tried to bypass the UI.

**Onboarding a new school.**

1. Super Admin signs up (first account becomes school owner).
2. Goes to **Settings → School Profile** and fills in school name, logo, address, academic year, terms.
3. Creates **Classes** (e.g. JSS 1A, SS 2 Science) and assigns a **Class Teacher**.
4. Adds **Subjects** and links them to classes.

**Adding students.** Two paths:

- **One by one** from Admin → Students → "Add Student" (creates the student record + optional login).
- **Bulk** from Admin → Bulk Upload (CSV template with name, class, parent email, etc.).
A student ID like `STU-2026-04821` is auto-generated.

**Connecting parents to their child.**

- When a student is created with a parent email, the system creates a pending parent invitation.
- Parent signs up at `/login` → "I am a Parent" → uses that email.
- A `parent_student_links` row connects them. A parent can be linked to multiple children, and a child can have multiple guardians.

**Teachers managing classes.**

- Admin assigns a teacher as Class Teacher or Subject Teacher on the Classes page.
- The teacher then sees ONLY their classes in their portal — gradebook, attendance, assignments are pre-filtered.
- They enter CA + Exam scores → grades auto-calculate letter + remark → submit for admin approval → approved grades become visible to students and parents.

---

## Step 3 — Fix Everything Broken

**Auth & routing**

- Verify the auth flow end-to-end for all 4 roles (signup → email verify → login → correct redirect).
- Fix the superadmin auto-routing for `ezeo78542@gmail.com` (memory rule).
- Add a clearer error toast for "Email not confirmed" with a "Resend verification" link.

**Data scoping (the big one)**

- **Staff**: filter `StaffStudents`, `StaffClasses`, `StaffGradebook`, `StaffAttendance` by `teachers.user_id = auth.uid()` joined to `classes.class_teacher_id` and `class_subjects.teacher_id`.
- **Student**: every page must resolve `students.id` from `auth.uid()` via the existing `get_student_id()` SECURITY DEFINER function before querying child tables.
- **Parent**: every child page must `IN (SELECT student_id FROM parent_student_links WHERE parent_user_id = auth.uid())`. Add a child-switcher dropdown in `ParentLayout` header when >1 child.

**Add-student flow**

- Admin "Add Student" form: validate class assignment, generate student_id, optionally send parent invite email.
- Ensure the trigger `handle_new_user_registration` doesn't double-create student rows when admin pre-creates them.

**RLS audit (Step 5 dovetails here)**

- Run the Supabase linter, then write a migration that tightens any policy where a user can read another user's row. Particular focus: `grades`, `attendance`, `fee_payments`, `messages`, `behavioral_records`, `health_records`, `counseling_sessions`.

**Misc bug sweep**

- Predictive Analytics empty-state.
- Financial Intelligence empty-state.
- Fix any console errors found by visiting each route in the browser tool.

---

## Step 4 — Soft Redesign (keep structure, raise polish)

Scope is presentation only — no feature rewrites here.

- **Typography**: tighten the scale. H1 32/40, H2 24/32, body 14/22, captions 12/18. Keep Plus Jakarta Sans + Inter.
- **Spacing**: standardise to 4/8/12/16/24/32. Audit pages where cards touch edges on mobile.
- **Colour**: lock to the existing teal/orange tokens, retire one-off custom hex values found in a few pages.
- **Buttons**: one elevated style (soft shadow + 150ms press scale), one ghost, one destructive. Replace ad-hoc button classes.
- **Forms**: consistent label/help/error pattern, 44px min input height for mobile.
- **Cards**: unify on `premium-card` + `shadow-card` from index.css. Remove duplicate shadow utilities.
- **Login page**: redesign the role chooser so each role tile is clearly labelled (Student / Teacher / Parent / Admin) with subtitle + icon, and keep a "Back to role" link visible.
- **Mobile**: audit all admin tables (currently overflow on 390px). Convert to stacked cards under `md`.
- **Micro-animations**: keep existing fade/scale; add a subtle stagger on dashboard stat cards.

No new colour palette, no new fonts, no layout rebuild — pure polish pass.

---

## Step 5 — Backend & Auth Verification

- Confirm Lovable Cloud is reachable (`supabase--cloud_status`).
- Run `supabase--linter` and fix every WARN/ERROR related to the new migration.
- Verify RLS on all 50 tables. Spot-check by logging in as each role in the browser tool and attempting cross-role reads.
- Test signup → verify email → login → password reset → reset-password page for all 4 roles.
- Ensure `parent` role is added by the `handle_new_user_registration` trigger (currently only branches on student vs teacher/admin — parent falls through). **This is a likely real bug.**

---

## Step 6 — Final Summary (delivered at end of implementation)

After the work, I will hand back:

1. The updated feature list with status badges (✅ working / ⚠ known limitation).
2. The principal-friendly platform explanation refreshed with any changes.
3. A "needs your attention" list (e.g. email provider config, payment gateway keys, anything requiring your decision).
4. A short demo script: which logins to use, which 5-minute happy path to walk through.

---

## Technical Section

**Files most likely to change**

- `src/pages/Login.tsx` — role chooser polish, parent verification link
- `src/components/ProtectedRoute.tsx` — keep, no logic change
- `src/components/layout/ParentLayout.tsx` — add child-switcher
- `src/pages/parent/Parent*.tsx` — scope queries to linked children
- `src/pages/staff/Staff{Students,Classes,Gradebook,Attendance}.tsx` — filter by teacher
- `src/pages/student/StudentReports.tsx` — term-payment gate
- `src/pages/admin/AdminStudentsPage.tsx` — Add Student flow
- `src/index.css` + a few component files — typography/spacing/button tokens

**Migrations**

- One migration tightening RLS on `grades`, `attendance`, `fee_payments`, `messages`, `behavioral_records`, `health_records`, `counseling_sessions`, `parent_student_links`.
- One migration patching `handle_new_user_registration()` to handle `role = 'parent'` (create profile only, no student/teacher row).

**Order of execution**

1. RLS + trigger migration (Step 5 + Step 3 data layer).
2. Code-side query scoping (Step 3).
3. Auth flow verification in the browser tool.
4. Soft redesign pass (Step 4).
5. Walk every route, capture findings, write Step 6 summary.

**Out of scope (will flag, not build)**

- Multi-school tenancy (currently single-school).
- Payment gateway integration (Paystack/Flutterwave) — needs your keys.
- SMS notifications — needs provider choice.
- Native mobile app.

---

Approve this plan and I'll start with the RLS + parent-trigger migration, then move through the rest in order.