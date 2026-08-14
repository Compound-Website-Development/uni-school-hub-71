# Imagemakers Nursery and Primary School — Portal
## Complete Software Design & Functional Specification

Document version: 1.0
Date: 7 August 2026
Status: As-built documentation of the existing application (no code was modified to produce this document)
Audience: Product managers, designers (Readdy AI / Google Stitch), engineers, QA, and AI systems rebuilding this application from scratch

> Verification note: every statement about *current state* in this document (broken paths, empty tables, unused files, policy behaviour) was confirmed by reading the source file, querying the live Postgres schema, or querying live row counts. Where something could not be confirmed, it is explicitly labelled **[unverified]**.

---

# TABLE OF CONTENTS

1. Project Overview
2. Application Structure (every page)
3. User Roles
4. User Flows
5. Database
6. Features
7. Component Inventory
8. Design System
9. Validation Rules
10. Business Rules
11. Error Analysis
12. Feature Completeness Matrix
13. Improvement Opportunities
14. Design Rebuild Specification
15. Final Summary

---

# 1. PROJECT OVERVIEW

## 1.1 What this application does

This is a **multi-portal school management system (SMS)** built for a single Nigerian private school: **Imagemakers Nursery and Primary School**, Surulere, Lagos. It is a browser-based single-page application that replaces the school's paper-based admission register, handwritten report cards, and manual fee tracking with a role-scoped digital portal.

The system contains **four authenticated portals** plus a small set of public pages:

| Portal | Base route | Primary occupant |
|---|---|---|
| Student portal | `/student/*` | Pupils (and pupil-facing parents) |
| Staff portal | `/staff/*` | Teachers and admins |
| Admin portal | `/admin/*` | Admins / super admin |
| Parent portal | `/parent/*` | Guardians, authenticated by ID card credentials |
| Public | `/login`, `/apply`, `/parent-access`, `/s/:token`, `/verify`, `/reset-password` | Anyone |

## 1.2 Target users

1. **Pupils (ages ~3–12)** — Kindergarten 1 through Grade 6. In practice the pupil portal is used with parental supervision because of the pupils' age.
2. **Parents / guardians** — the highest-volume real user. They do not register; they use a printed **Parent ID + access code** from the child's ID card.
3. **Class teachers** — 13 class arms, each with 1–2 assigned teachers. They record attendance, enter CA/exam scores, build report cards, and set homework.
4. **School administrators / proprietor** — manage admissions, the roll, fees, ID cards, certificates, staff, and school-wide settings.
5. **Prospective parents** — submit an admission application through the public `/apply` form.

## 1.3 Business purpose

- Digitise the handwritten **admission register** (already used: 132 pupil records exist in the database).
- Produce the school's **official termly report card** in a consistent, printable, editable digital form.
- Give parents **self-service visibility** into results, attendance, and fees without physically visiting the school.
- Issue **verifiable ID cards and certificates** with QR codes to prevent forgery.
- Provide the proprietor with **operational dashboards** (enrolment, fees, attendance, behaviour, wellbeing).

## 1.4 Main problem it solves

The school's records lived on paper: a handwritten admission register, hand-computed CA/exam totals, and hand-written report cards. This produced (a) transcription errors, (b) no queryable history, (c) no parent visibility between terms, and (d) no way to verify that an ID card or certificate is genuine. The portal solves all four.

## 1.5 Overall architecture

```text
┌──────────────────────────────────────────────────────────────┐
│  Browser (React 18 SPA, Vite 5, TypeScript 5)                │
│                                                              │
│  BrowserRouter                                               │
│    └─ ErrorBoundary                                          │
│        └─ Routes  (78 route definitions)                     │
│             ├─ Public routes                                 │
│             └─ ProtectedRoute(allowedRoles) → Portal Layout  │
│                                                              │
│  Providers (outermost → innermost):                          │
│    ThemeProvider(next-themes, class strategy, default light) │
│      QueryClientProvider (@tanstack/react-query)             │
│        AuthProvider (custom, Supabase session + role)        │
│          TooltipProvider                                     │
│            Toaster (shadcn) + Sonner                         │
└───────────────┬──────────────────────────────────────────────┘
                │ supabase-js (anon key, JWT of signed-in user)
                ▼
┌──────────────────────────────────────────────────────────────┐
│  Supabase project  weqzvfpzuybyuvruumae                      │
│   • Postgres (49 public tables, RLS on all)                  │
│   • GoTrue auth (email/password)                             │
│   • Storage: bucket `student-photos` (private)               │
│   • Edge Functions: ai-assistant, mcp, parent-login,         │
│                     seed-admin                               │
│   • 11 SQL functions, 21 triggers, 1 event trigger           │
└──────────────────────────────────────────────────────────────┘
```

There is **no custom application server**. All business logic lives either in the React client or in Postgres (triggers + security-definer functions) plus four Deno edge functions.

## 1.6 Technologies used

| Layer | Technology |
|---|---|
| Framework | React 18 (function components + hooks only, no class components except `ErrorBoundary`) |
| Build | Vite 5 |
| Language | TypeScript 5 |
| Routing | react-router-dom v6 (`BrowserRouter`, declarative `<Routes>`) |
| Styling | Tailwind CSS v3 with HSL CSS-variable design tokens |
| Component library | shadcn/ui (Radix UI primitives) — 50 primitives present in `src/components/ui` |
| Icons | lucide-react (a legacy `DashboardLayout` also references Material Symbols icon names, but that layout is unused) |
| Charts | recharts (via shadcn `chart.tsx`) |
| Forms/validation | Native controlled inputs + **zod** schemas (no react-hook-form on the auth pages; `form.tsx` exists but is largely unused) |
| Toasts | Two systems in parallel: shadcn `useToast`/`<Toaster/>` and **sonner** |
| Theme | next-themes, `attribute="class"`, `defaultTheme="light"`, `enableSystem` |
| Data fetching | Direct `supabase.from(...)` calls inside `useEffect`. React Query is installed and mounted but **not used for any query** |
| QR generation | QR image via external QR endpoint in `AdminIDCards` / certificates |
| QR scanning | `html5-qrcode` wrapped by `src/components/QRScanner.tsx` |
| Agent integration | `@lovable.dev/mcp-js` — MCP server with 5 tools, OAuth-protected |

## 1.7 Database overview (Supabase / Postgres)

- **49 tables** in the `public` schema. Row Level Security is enabled on all of them (enforced automatically by the `rls_auto_enable` event trigger, which enables RLS on every newly created public table).
- Row counts at time of writing (live query):
  - `students` = **132**
  - `classes` = **13**
  - `profiles` = 2, `user_roles` = 2, `admin_permissions` = 1, `certificates` = 1, `parent_student_links` = 1
  - **All other 42 tables are empty (0 rows).**
- **11 SQL functions**, of which 7 are `SECURITY DEFINER` access helpers.
- **21 triggers**: 19 `set_updated_at`, 1 `grades_compute` (INSERT + UPDATE), 1 auth `on_auth_user_created`.
- Roles are stored in a dedicated `user_roles` table with an `app_role` enum (`student | teacher | admin | parent`). Roles are **never** stored on `profiles` — this is the correct anti-privilege-escalation pattern.

## 1.8 Authentication method

- **Supabase GoTrue email + password.** No OAuth social providers, no magic links, no phone/OTP.
- On `auth.users` INSERT, the `handle_new_user()` trigger creates a `profiles` row and a `user_roles` row, reading the desired role from `raw_user_meta_data->>'role'` with a fallback to `'student'`.
- The client wraps this in `AuthProvider` (`src/hooks/useAuth.tsx`), which:
  - subscribes to `onAuthStateChange` and separately calls `getSession()`,
  - defers the profile fetch with `setTimeout(..., 0)` to avoid deadlocking the auth callback,
  - loads `user_roles.role`, then role-specific data (`students` row for students, `staff_teacher_records()` RPC for teacher/admin),
  - exposes `{ user, session, isLoading, userRole, studentData, teacherData, signUp, signIn, signOut }`.
- **Parents never sign up.** `ParentAccess` posts `{parentId, code}` to the `parent-login` edge function, which validates against `students.parent_id` / `students.parent_code`, deterministically derives a synthetic email `parent.<id>@imagemakers.local` and password `<PARENTID>#<CODE>#ims`, creates or updates the auth user with the service role, upserts the `parent` role, links `parent_student_links` rows, and returns the credentials to the browser, which then performs a normal `signInWithPassword`.
- Route protection is client-side only via `ProtectedRoute` (`allowedRoles`). Admins bypass all role gates. Real enforcement is RLS in the database.

## 1.9 Storage

One bucket:

| Bucket | Public | Contents | Path convention |
|---|---|---|---|
| `student-photos` | No (private) | Pupil passport photographs | `<studentKey>/passport.<ext>` |

Uploads go through `uploadStudentPhoto()` in `src/lib/studentUtils.ts`, using `upsert: true`, and return a **1-year signed URL** which is written to `students.photo_url`. Consequence: the stored URL expires after 365 days and is not automatically refreshed.

## 1.10 APIs, edge functions and external integrations

| Edge function | Auth | Purpose |
|---|---|---|
| `parent-login` | Public (service role internally) | Exchanges Parent ID + access code for parent portal credentials; provisions the parent auth user and `parent_student_links` |
| `ai-assistant` | JWT | Proxies chat completions to the **Lovable AI Gateway** using `LOVABLE_API_KEY`. Two system prompts: `homework` (tutor) and `report_comment` (report card comments / financial forecast analysis) |
| `seed-admin` | JWT | One-off admin bootstrap utility |
| `mcp` | `verify_jwt = false` in `supabase/config.toml`; OAuth enforced inside | Model Context Protocol server |

**MCP server** (`src/lib/mcp/index.ts`) exposes 5 RLS-scoped tools to external AI agents: `get_my_profile`, `list_classes`, `list_students`, `get_student_record`, `list_announcements`. It uses `auth.oauth.issuer` against the Supabase auth issuer with audience `authenticated`. A consent page is served at `/.lovable/oauth/consent`.

**Not integrated (confirmed absent):**
- No email provider (Resend/SendGrid/etc.). The only email sent is Supabase's built-in auth mail (confirmation, password reset).
- No payment provider (no Stripe, Paddle, Paystack, or Flutterwave). Fees are *recorded*, never *collected*. Parents upload a `payment_proofs` record instead.
- No SMS/WhatsApp gateway.
- No analytics/telemetry SDK.

## 1.11 File uploads

Two paths exist:
1. Pupil passport photos → `student-photos` bucket (implemented end to end).
2. `payment_proofs.file_url`, `academic_resources.file_url`, `assignment_submissions.file_url` are **plain text URL columns with no dedicated bucket** — file-based uploads for these features are not wired to storage.

## 1.12 QR code generation

- **ID cards** (`/admin/id-cards`) render a QR image whose payload is the public profile URL `<origin>/s/<students.public_token>`.
- **Certificates** (`/admin/certificates`) render a QR pointing at `/verify` for serial-number verification.
- QR **images** are produced by requesting a remote QR rendering endpoint with the encoded URL — i.e. an outbound network dependency at print time.
- **Scanning** happens on `/login` via `QRScanner` (`html5-qrcode`). The scanner accepts either a full same-origin URL or a bare UUID and routes to `/s/:token`.

## 1.13 Notifications

- Table `notifications` (per-user, `is_read` flag, optional `link`).
- `useRealtimeNotifications` subscribes to Supabase Realtime inside a `useEffect` and is mounted by `AdminLayout` (and other portal layouts).
- `NotificationDropdown` renders the bell + unread badge in the header.
- The table currently has **0 rows** — nothing in the app writes notifications except `AdminPredictiveAnalytics`, which can insert at-risk alerts.

---

# 2. APPLICATION STRUCTURE

There are **78 route definitions** in `src/App.tsx` and **76 page files**.

Global route behaviour:
- `/` → `<Navigate to="/login" replace />`. The marketing homepage `src/pages/Index.tsx` exists but is **not imported anywhere** (dead code).
- `*` → `NotFound`.
- All authenticated routes are wrapped in `<ProtectedRoute allowedRoles={[...]}>`.
- The whole `<Routes>` tree is wrapped in `<ErrorBoundary>`, so a render-time crash shows a recoverable "Try Again" card rather than a blank page.

Common cross-page conventions (apply unless stated otherwise):
- **Loading state:** a centred spinner — `w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin` — or shadcn `Skeleton` blocks.
- **Empty state:** `EmptyState` component or an inline muted-foreground sentence inside a `Card`.
- **Error state:** `toast.error(...)` (sonner) or `toast({variant:"destructive"})` (shadcn). No inline error banners.
- **Success:** green sonner toast.
- **Pagination:** none. Every list renders the full result set (Supabase caps at 1000 rows).
- **Sorting:** mostly fixed `order()` in the query; only a few pages expose sort controls.
- **Responsive:** desktop = fixed sidebar + content; mobile = `MobileHeader` with a `Sheet` drawer; the student portal additionally has a fixed `BottomNavigation` bar (`md:hidden`).

## 2.1 Public pages

### 2.1.1 Login — `/login`
- **Purpose:** single entry point for students, teachers and admins; QR gateway for parents.
- **Access:** anyone. Redirects signed-in users to their portal by role (`student → /student`, `admin → /admin`, `teacher → /staff`, `parent → /parent`).
- **Navigation entry:** `/` redirects here; every "Log out" returns here.
- **Structure:** centred card on a sky gradient; school crest; a **user-type selector** (Student / Staff cards with `GraduationCap` and `Briefcase` icons); then the credential form.
- **Actions:** sign in; toggle password visibility (`Eye`/`EyeOff`); **Scan ID card** button opening a `Dialog` with the live camera QR scanner; link to `/parent-access`; link to `/apply`; link to `/reset-password`; a **register toggle** that switches the card to a sign-up form.
- **Validation (zod):** `loginSchema` — email must be a valid email, password ≥ 6 chars. `registerSchema` — first name, last name, phone required; email valid; password ≥ 6; `confirmPassword` must match (zod `.refine`).
- **Error states:** field-level red helper text from the zod issue map; toast for `Invalid login` → "Invalid email or password", `Email not confirmed` → "Please verify your email before logging in", otherwise a generic message.
- **`next` redirect:** if `?next=/…` is present and is same-origin (`startsWith("/") && !startsWith("//")`), the user is sent there after login. Used by the OAuth consent flow.
- **Note:** the sign-up toggle is still present in the UI even though student self-registration was intended to be removed.

### 2.1.2 Admission Application — `/apply`
- **Purpose:** public admission enquiry form; the largest page in the codebase (688 lines).
- **Access:** anonymous (`applications` has an `INSERT` policy `WITH CHECK (true)` for `anon, authenticated`).
- **Sections:** pupil bio (names, DOB, gender, nationality), contact (email, phone, address, village), prior schooling (previous school, last grade completed), the grade being applied for, programme, and guardian block (name, relation, phone, email).
- **Outcome:** inserts a row into `applications` with `status = 'pending'` and a generated `application_id`; success screen displays the reference.
- **Current data:** `applications` is empty (0 rows).

### 2.1.3 Parent Access — `/parent-access`
- **Purpose:** the parent login. Two fields only: **Parent ID** (`IMS-P-XXXXXX`) and **Access code** (6 chars). Both inputs force uppercase and use a monospace font, `maxLength=32`.
- **Client validation:** both fields ≥ 4 characters, otherwise a sonner error.
- **Flow:** `supabase.functions.invoke("parent-login")` → receive `{email, password}` → `signInWithPassword` → navigate to `/parent`.
- **Errors:** "Parent ID or access code is incorrect." (401), "Unable to verify right now. Try again." (500), "Could not open your dashboard. Please try again." (sign-in failure).
- **Copy note:** explicitly states "Two parents may use the same ID."

### 2.1.4 Public Student Profile — `/s/:token`
- **Purpose:** the destination of an ID-card QR scan. Read-only, unauthenticated verification page.
- **Data:** two security-definer RPCs, `public_student_profile(_token)` and `public_student_results(_token)`.
- **Shows:** full name, admission number, class, photo, status, attendance present/total. Results are shown **only where `term_results.is_published = true`**.
- **Empty state:** invalid token → "not found" card.

### 2.1.5 Verify Certificate — `/verify`
- Serial-number lookup against `certificates`. Displays type, serial, issue date, and the pupil.

### 2.1.6 Reset Password — `/reset-password`
- Supabase password recovery/update screen.

### 2.1.7 OAuth Consent — `/.lovable/oauth/consent`
- Approve/deny screen for MCP clients. Unauthenticated visitors are bounced to `/login?next=…`.

### 2.1.8 NotFound — `*`
- 404 card with a link home.

### 2.1.9 Index — `src/pages/Index.tsx` (**unreferenced**)
- A marketing homepage that is not imported by `App.tsx` and therefore unreachable.

## 2.2 Student portal (`/student/*`, role `student`, admin bypass)

Layout: `StudentLayout` — sidebar nav (14 entries), `MobileHeader` + `Sheet` on mobile, `BottomNavigation` (Home / Grades / Reports / Schedule / Profile), `AIChatWidget` floating button, `NotificationDropdown`, `ThemeToggle`.

| Page | Route | Tables / RPCs | Purpose & key behaviour |
|---|---|---|---|
| Dashboard | `/student` | `grades`, `term_results` | Stat cards (average, position, subjects), latest results preview, `SchoolInfoPanel` |
| Community Wall | `/student/wall` | via `CommunityWall` → `wall_posts`, `wall_comments`, `wall_reactions` | Post composer, feed, comment, react |
| My Results | `/student/grades` | `grades`, `term_results`, `terms` | Term selector; per-subject CA / exam / total / grade / remark; grade-colour badges |
| Attendance | `/student/attendance` | `attendance` | Present / absent / late counts and a percentage |
| Reports | `/student/reports` | `grades`, `term_results`, `terms` | Printable termly report; gated on `is_published` |
| Transcript | `/student/transcript` | `grades` | Cumulative multi-term subject history |
| Fee Payments | `/student/fees` | `fee_items`, `fee_payments` | Billed items vs paid, outstanding balance |
| Announcements | `/student/announcements` | `announcements` | Published notices filtered by `target_role` |
| CBT Exams | `/student/exams` | `exams`, `exam_submissions` | Lists published exams, shows submitted/available status |
| Take Exam | `/student/exams/:id` | `exams`, `student_exam_questions()` RPC, `exam_submissions` | Full-screen exam runner (see 2.2.1) |
| Homework | `/student/homework` | `assignments`, `assignment_submissions` | Due list; submit text/URL |
| Library | `/student/library` | `library_books`, `book_issues` | Catalogue and the pupil's borrowed books |
| Calendar | `/student/calendar` | `school_events` | Event list by date |
| Complaints | `/student/complaints` | `complaints` | Raise a complaint; view own + staff response |
| Resources | `/student/resources` | `academic_resources` | Published downloadable materials |
| My Profile | `/student/profile` | `students` | Read-only bio, photo, class, guardian details |
| Settings | `/student/settings` | none | Theme, local preferences |
| Schedule | `/student/schedule` | `schedules` | Weekly timetable grid by `day_of_week` |

#### 2.2.1 Take Exam — detailed behaviour
- Sticky top bar: exam title, "Question N of M", live MM:SS countdown chip. Under 300 seconds the chip turns destructive and pulses, and a warning banner appears.
- Questions are fetched via `student_exam_questions()`, which deliberately **omits `correct_index`** and only returns questions for published exams.
- On mount, an existing `exam_submissions` row is resumed; if `submitted_at` is set the pupil is redirected back to `/student/exams`. Otherwise a new submission row is created with `answers: {}`.
- Answers auto-save with a 2-second debounce.
- Options render as large tappable buttons with A/B/C/D circular letter chips; the selected option gets a primary border and tinted background.
- A question navigator renders a grid of numbered buttons: current = primary, answered = success tint, unanswered = muted.
- Timer reaching zero auto-submits.
- **Scoring is not implemented.** `handleSubmit` loops the questions and accumulates `totalPoints` into unused local variables, then writes only `{answers, submitted_at}`. `exam_submissions.score` is never populated.

## 2.3 Staff portal (`/staff/*`, roles `teacher` + `admin`)

Layout: `StaffLayout` — 16 sidebar entries.

| Page | Route | Tables | Behaviour |
|---|---|---|---|
| Dashboard | `/staff` | `applications`, `attendance`, `class_subjects`, `classes`, `grades`, `lesson_plans`, `schedules`, `students` | KPI cards, today's timetable, pending items, and the **`StaffClockIn`** card |
| Community Wall | `/staff/wall` | wall tables | Shared `CommunityWall` |
| Students | `/staff/students` | `students`, `classes`, `class_subjects`, `teachers` | Searchable roster, class filter, student detail |
| Classes | `/staff/classes` | `classes`, `students` | Class arms with headcounts |
| Attendance | `/staff/attendance` | `attendance`, `classes`, `schedules`, `students` | Date + class picker, present/absent/late toggles per pupil, bulk save (466 lines) |
| Gradebook | `/staff/gradebook` | `classes`, `grades`, `students`, `subjects`, `terms` | The core marks-entry grid: class × subject × term, CA and exam columns; totals/letters/remarks computed by DB trigger (561 lines) |
| CBT Exams | `/staff/cbt` | `exams`, `exam_questions`, `classes`, `subjects` | Create exam, add MCQ questions with `options` JSONB + `correct_index`, publish toggle |
| Assignments | `/staff/assignments` | `assignments`, `classes`, `subjects` | Create/list homework with due date and max score |
| Lesson Plans | `/staff/lesson-plans` | `lesson_plans`, `classes`, `subjects` | Topic, objectives, activities, resources, homework |
| Reports | `/staff/reports` | `classes`, `grades`, `students`, `terms` | Class performance summary and export |
| Report Cards | `/staff/report-card` | **none** | Hosts `ReportCardEditor`; persists to `localStorage` only |
| Admissions | `/staff/admissions` | `applications`, `students` | Review applications, approve → create pupil record, reject with reason |
| Messages | `/staff/messages` | `messages` | Inbox/compose, `is_read` |
| Forum | `/staff/forum` | `forum_posts`, `forum_replies` | Threaded staffroom discussion |
| Leave | `/staff/leave` | `leave_requests` | Request leave, view status |
| My Profile | `/staff/profile` | `teachers`, `staff_teacher_records()` | Own staff record |
| Bulk student upload | `/staff/admin/students` | `students`, `classes` | CSV-style bulk create |
| Manage users | `/staff/admin/users` | `admin_permissions`, `staff_teacher_records()` | Admin permission toggles |

## 2.4 Admin portal (`/admin/*`, role `admin`)

Layout: `AdminLayout` — sidebar grouped into **7 labelled sections**: Overview, People, Finance & Comms, AI & Analytics, Facilities, Documents, System. Header includes optional search, notifications, theme toggle, avatar with initials, and "open other portal in new tab" links (Staff / Student / Parent).

| Section | Page | Route | Tables |
|---|---|---|---|
| Overview | Dashboard | `/admin` | students, teachers, classes, attendance, fee_payments, applications, announcements, activity_logs |
| Overview | Analytics | `/admin/analytics` | classes, grades (enrolment trend is **synthetic** — the source comments it as mock) |
| Overview | Activity Logs | `/admin/activity` | activity_logs |
| People | Students | `/admin/students` | students, classes (+ `StudentFormDialog`) |
| People | Staff | `/admin/staff` | teachers, `staff_teacher_records()` (+ `StaffFormDialog`) |
| People | Pending Approvals | `/admin/approvals` | applications |
| Finance | Fee Management | `/admin/fees` | fee_items, fee_payments |
| Finance | Financial Intelligence | `/admin/financial` | fee_items, fee_payments, students (monthly trend is **mock**, AI commentary via `ai-assistant`) |
| Finance | Announcements | `/admin/announcements` | announcements |
| Finance | Reports & Export | `/admin/reports` | students, classes, grades, attendance, fee_payments, teachers |
| AI | Predictive Analytics | `/admin/predictive` | attendance, grades, assignment_submissions, students, parent_student_links, notifications — computes at-risk pupils and can notify guardians |
| AI | Behavioral Records | `/admin/behavioral` | behavioral_records, students |
| AI | Student Wellbeing | `/admin/wellbeing` | counseling_sessions, students |
| Facilities | Library | `/admin/library` | library_books |
| Facilities | Transport | `/admin/transport` | transport_routes |
| Facilities | Visitors | `/admin/visitors` | visitor_log |
| Facilities | Inventory | `/admin/inventory` | inventory_items |
| Facilities | Substitutions | `/admin/substitutions` | substitutions, schedules, teachers |
| Documents | ID Cards | `/admin/id-cards` | students, classes, `staff_teacher_records()` |
| Documents | Certificates | `/admin/certificates` | certificates, students |
| Documents | Complaints | `/admin/complaints` | complaints |
| System | Admission Register | `/admin/register-import` | students, classes |
| System | Bulk Upload | `/admin/bulk-upload` | students, classes |
| System | Manage Users | `/admin/users` | admin_permissions |
| System | School Settings | `/admin/settings` | school_settings, subjects, programmes |

### 2.4.1 ID Cards — detailed
- Tabs for **Students** and **Staff**; class filter and search.
- Portrait double-sided card design at ID-1 proportions.
- **Front:** sky-blue header band, school crest on a white circular backing, pupil passport photo, full name, admission number, class, and the QR code linking to `/s/:public_token`.
- **Back:** school address and phones, **PARENT ID** (`IMS-P-XXXXXX`), **ACCESS CODE**, and return-if-found text.
- `ensureParentAccess()` lazily generates and persists `parent_id`/`parent_code` for any pupil missing them when the card is rendered or printed. Generators live in `src/lib/studentUtils.ts`: `generateParentId()` → `IMS-P-` + 6 chars, `generateParentCode()` → 6 chars, both from the ambiguity-free alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no I, O, 0, 1).
- Print via `window.print()` with print-specific CSS.

### 2.4.2 Admission Register Import — detailed
- Paste raw transcribed text from the handwritten register.
- The text is parsed into an editable grid: admission number, surname, first name, DOB, gender, guardian, phone.
- "Seed classes" action creates the 13 class arms from `CLASS_STRUCTURE`.
- Temporary class assignment is suggested from DOB via `suggestClassId()` and remains editable per row.
- Bulk insert into `students`.

## 2.5 Parent portal (`/parent/*`, role `parent`)

Layout: `ParentLayout` — 8 sidebar entries. Every page resolves the parent's children through `parent_student_links` first, then queries child-scoped data.

| Page | Route | Tables |
|---|---|---|
| Dashboard | `/parent` | parent_student_links, students, grades, attendance, assignments, exams, announcements |
| Community Wall | `/parent/wall` | wall tables |
| Child's Grades | `/parent/grades` | parent_student_links, students, grades |
| Attendance | `/parent/attendance` | parent_student_links, students, attendance |
| Fees | `/parent/fees` | parent_student_links, students, fee_payments |
| Messages | `/parent/messages` | messages |
| Forum | `/parent/forum` | forum_posts, forum_replies |
| My Profile | `/parent/profile` | profiles, parent_student_links, students |

---

# 3. USER ROLES

The `app_role` enum has exactly **four** values: `student`, `teacher`, `admin`, `parent`.

There is **no** separate Principal, Receptionist, Accountant, or Librarian role. Those job functions are folded into `admin` (the librarian screen, visitor log, and fee screens are all admin-only). "Super Admin" is not a distinct enum value — it is an `admin` who additionally holds `admin_permissions.can_add_admins = true`.

## 3.1 Student
- **Dashboard:** `/student`
- **Can:** view own grades/attendance/fees/timetable/announcements/library/calendar/resources; sit published CBT exams; submit homework; post to the community wall; raise complaints; edit theme settings.
- **Cannot:** see other pupils' data (blocked by `can_view_student()` in RLS), enter marks, see `exam_questions.correct_index` (the student RPC strips it), read `activity_logs`, access `/staff/*` or `/admin/*`.
- **Nav:** 14-item sidebar + 5-item bottom bar on mobile.

## 3.2 Teacher
- **Dashboard:** `/staff`
- **Can:** everything `is_staff()` allows — which in the current RLS design is **all staff-manageable tables school-wide**: every pupil, every class, every grade, attendance, assignments, lesson plans, exams (including answer keys), applications, announcements, library, behaviour and counselling records.
- **Cannot:** access `/admin/*` (client-side gate only), manage `admin_permissions` beyond reading own row, delete `user_roles` (no DELETE policy exists on `user_roles` for anyone).
- **Important:** teachers are **not scoped to their own classes** in RLS. `is_staff()` grants school-wide access.

## 3.3 Admin (and Super Admin)
- **Dashboard:** `/admin`
- **Can:** everything a teacher can, plus the entire admin portal: fees, ID cards, certificates, register import, bulk upload, school settings, activity logs, inventory, transport, visitors, substitutions, predictive analytics.
- **Bypass:** `ProtectedRoute` short-circuits for `userRole === "admin"`, so an admin can open the student, staff, and parent portals directly (and `AdminLayout` offers "open in new tab" links for exactly that).
- **Super admin distinction:** `admin_permissions` booleans — `can_add_admins`, `can_manage_students`, `can_upload_bulk_data`, `can_approve_grades`, `can_manage_teachers`, `can_manage_fees`, `can_view_reports`. These flags are edited on `/staff/admin/users` but are **not enforced by RLS** — RLS only checks `is_staff()` / `has_role(admin)`.

## 3.4 Parent
- **Dashboard:** `/parent`
- **Authentication:** Parent ID + access code, never self-registration.
- **Can:** view linked children's grades (published only, via `can_view_student()`), attendance, fees, and certificates; message staff; post on the forum and wall; view own profile.
- **Cannot:** edit any academic record, see unlinked pupils, access staff/admin portals.
- **Linking:** `parent_student_links` rows are created automatically by `parent-login` for every pupil sharing that `parent_id` — this is how siblings appear under one login.

## 3.5 Anonymous / public
- **Can:** submit an application, look up a public pupil profile by token, verify a certificate serial, request a password reset, sign in.
- **Notable:** `certificates` has an `anon` SELECT policy with `USING (true)`, so any anonymous caller can enumerate all certificate rows, not just the one being verified.

---

# 4. USER FLOWS

## 4.1 Top-level entry

```text
Visitor
  │
  ▼
 "/"  ──redirect──►  /login
                       │
        ┌──────────────┼─────────────────┬──────────────┐
        ▼              ▼                 ▼              ▼
  Email+password   Scan ID QR      /parent-access    /apply
        │              │                 │              │
        │              ▼                 ▼              ▼
        │           /s/:token       parent-login    application
        │        (public profile)   edge function     submitted
        ▼                                │
  role lookup (user_roles)               ▼
        │                          signInWithPassword
   ┌────┼────┬─────────┐                 │
   ▼    ▼    ▼         ▼                 ▼
/student /staff /admin /parent        /parent
```

## 4.2 Admission → enrolled pupil

```text
Guardian fills /apply
        ▼
applications row (status = 'pending', application_id generated)
        ▼
Admin opens /admin/approvals  (or teacher opens /staff/admissions)
        ▼
   ┌────────────┬───────────────┐
   ▼            ▼               ▼
 Approve     Reject         Leave pending
   │         (rejection_reason, status='rejected')
   ▼
students row created  (generated_student_id written back onto the application)
   ▼
Admin assigns class (suggested from DOB, editable)
   ▼
Admin opens /admin/id-cards → ensureParentAccess() writes parent_id + parent_code
   ▼
Card printed → guardian receives Parent ID + access code
```

## 4.3 Bulk register import

```text
Admin → /admin/register-import
   ▼
Paste transcribed register text
   ▼
Parser → editable grid (adm no, surname, first name, DOB, gender, guardian, phone)
   ▼
[Seed classes]  → creates the 13 class arms if absent
   ▼
DOB → suggestLevelForDob() → suggestClassId()  (editable per row)
   ▼
[Import]  → bulk insert into students
```

## 4.4 Attendance

```text
Teacher → /staff/attendance
   ▼
Pick date + class
   ▼
Existing attendance rows for that (class, date) are loaded
   ▼
Per pupil: Present | Absent | Late  (+ optional note)
   ▼
Save → upsert into attendance (marked_by = auth.uid())
   ▼
Visible to: pupil (/student/attendance), parent (/parent/attendance),
            public profile counts (present / total)
```

## 4.5 Grading and report cards

```text
Teacher → /staff/gradebook
   ▼
Select class → subject → term
   ▼
Enter continuous_assessment (0–40) and exam_score (0–60) per pupil
   ▼
INSERT/UPDATE grades
   ▼
── DB trigger grades_compute (BEFORE INSERT OR UPDATE) ──
     total_score  = COALESCE(ca,0) + COALESCE(exam,0)
     letter_grade = A≥90 B≥80 C≥70 D≥60 E≥50 else F
     remark       = Outstanding / Excellent / Very Good / Very Good /
                    Good / Fair / Poor
     updated_at   = now()
   ▼
Admin/teacher writes term_results (average, position, comments)
   ▼
term_results.is_published = true
   ▼
Pupil sees /student/reports; parent sees /parent/grades;
public profile shows results via public_student_results()
```

Parallel, **not connected to the database**:

```text
Teacher → /staff/report-card  →  ReportCardEditor
   ▼
Fill pupil header, 12 subject rows (CA 40 / Exam 60), affective + psychomotor
ratings (1–5), position, teacher & head-teacher comments
   ▼
[Save] → localStorage draft      [Print] → window.print()
   ▼
No Supabase write. This editor is intentionally standalone today.
```

## 4.6 CBT examination

```text
Teacher → /staff/cbt
   ▼
Create exam (title, subject, class, duration_minutes, start/end, status)
   ▼
Add questions: question_text, options[] (JSONB), correct_index, points
   ▼
is_published = true
   ▼
Pupil → /student/exams → sees published exam → opens /student/exams/:id
   ▼
student_exam_questions() RPC returns questions WITHOUT correct_index
   ▼
exam_submissions row created (or resumed if not yet submitted)
   ▼
Answers auto-save every 2s ; timer counts down
   ▼
Manual submit OR timer hits 0 → sets submitted_at
   ▼
[GAP] score is never calculated — exam_submissions.score stays NULL
```

## 4.7 Fees

```text
Admin → /admin/fees → create fee_items (name, amount, term, class)
   ▼
Pupil/parent → /student/fees or /parent/fees → sees billed vs paid vs outstanding
   ▼
Payment happens OFF-PLATFORM (bank transfer)
   ▼
Parent uploads evidence → payment_proofs (status = 'pending')
   ▼
Admin reviews → status approved/rejected (reviewed_by, reviewed_at)
   ▼
Admin records fee_payments row
   ▼
/admin/financial aggregates collection rate + AI commentary
```

## 4.8 Staff geofenced clock-in

```text
Teacher opens /staff (dashboard)
   ▼
StaffClockIn loads today's staff_attendance row for user_id + date
   ▼
[Clock in] → navigator.geolocation.getCurrentPosition(highAccuracy, 15s)
   ▼
Haversine distance to SCHOOL.coords (6.5095, 3.3596)
   ▼
 distance > 400 m ?
   ├─ yes → error "You are about Nm from the school. Clock-in only works on campus."
   └─ no  → insert staff_attendance { user_id, teacher_id, date, clock_in: now,
                                      is_late: now > 07:45 }
   ▼
[Clock out] → same geofence check → update clock_out
```

## 4.9 QR verification

```text
Anyone with a camera → /login → [Scan ID card] → Dialog with html5-qrcode
   ▼
Decoded text matched against  /s/<uuid>  or a bare <uuid>
   ▼
match → navigate /s/:token → public_student_profile() + public_student_results()
no match, same-origin URL → navigate to that path
otherwise → toast "That QR code is not an Imagemakers ID card."
```

## 4.10 Password reset

```text
/login → "Forgot password" → Supabase resetPasswordForEmail(redirectTo=/reset-password)
   ▼
Email from Supabase GoTrue (no custom provider)
   ▼
/reset-password → updateUser({password}) → back to /login
```

## 4.11 MCP / agent connection

```text
AI client → MCP endpoint  https://weqzvfpzuybyuvruumae.supabase.co/functions/v1/mcp
   ▼
OAuth 2.1 against the Supabase auth issuer (dynamic client registration)
   ▼
Unauthenticated → /login?next=/.lovable/oauth/consent
   ▼
Consent screen → approve
   ▼
Bearer token → tools execute through an RLS-aware Supabase client
     get_my_profile · list_classes · list_students ·
     get_student_record · list_announcements
```

---

# 5. DATABASE

Project ref: `weqzvfpzuybyuvruumae`. Schema: `public`. RLS enabled on all 49 tables.

## 5.1 Recurring conventions

- Primary keys: `id uuid` default `gen_random_uuid()`.
- Timestamps: `created_at timestamptz not null default now()`; where a table is editable, `updated_at timestamptz not null default now()` maintained by the `set_updated_at` BEFORE UPDATE trigger calling `update_updated_at_column()`.
- User references are **plain `uuid` columns**, never FKs to `auth.users`.
- Status columns are free-text `text` with a default, **not enums and not CHECK-constrained** (except `user_roles.role`, which uses the `app_role` enum).

## 5.2 Access-control helper functions

| Function | Returns | Logic |
|---|---|---|
| `has_role(_user_id, _role)` | boolean | EXISTS in `user_roles` — SECURITY DEFINER, STABLE, `search_path=public` |
| `is_staff(_user_id)` | boolean | role IN ('teacher','admin') |
| `can_view_student(_student_id)` | boolean | `is_staff(auth.uid())` OR the pupil's own `user_id` OR a `parent_student_links` row for `auth.uid()` |
| `staff_teacher_records()` | SETOF teachers | All teachers if staff, else only own row — used so teacher contact details are not exposed wholesale |
| `student_exam_questions(_exam_id)` | question set | Published exams only, **omits `correct_index`** |
| `public_student_profile(_token)` | 1 row | Name, admission no, class, photo, status, attendance present/total — by `public_token` |
| `public_student_results(_token)` | result rows | Only where `term_results.is_published = true` |
| `handle_new_user()` | trigger | Creates `profiles` + `user_roles` from `raw_user_meta_data`, defaults role to `student`, both `ON CONFLICT DO NOTHING` |
| `compute_grade_fields()` | trigger | Grade computation (see 10.1) |
| `update_updated_at_column()` | trigger | `NEW.updated_at = now()` |
| `rls_auto_enable()` | event trigger | Enables RLS automatically on every new `public` table |

## 5.3 Table catalogue

### Identity & access

**`profiles`** — one per auth user. `user_id, first_name, last_name, email, phone, address, avatar_url, bio`. 3 policies; DELETE denied. Populated by `handle_new_user()`. Rows: 2.

**`user_roles`** — `user_id, role app_role`, UNIQUE `(user_id, role)`. **1 policy, SELECT only** — INSERT/UPDATE/DELETE are all denied to every client role, so roles can only be changed by the service role or the signup trigger. This is deliberate and correct. Rows: 2.

**`admin_permissions`** — 7 boolean capability flags per admin user. Readable by self or admins; manageable by staff. Rows: 1. **Not enforced by RLS anywhere.**

**`parent_student_links`** — `parent_user_id, student_id, relation`. The join that powers the entire parent portal and one branch of `can_view_student()`. Rows: 1.

### Core academic

**`students`** (rows: **132**) — the central table.
Columns: identity (`student_id` admission number, `first_name`, `middle_name`, `last_name`), bio (`date_of_birth`, `gender`, `nationality`, `state_of_origin`, `religion`, `blood_group`, `bio`, `hobbies`), contact (`email`, `phone`, `address`, `emergency_contact`), guardian (`guardian_name`, `guardian_phone`, `guardian_email`, `guardian_relation`, `parent_phone`), placement (`class_id` → classes, `programme_id` → programmes, `section`, `admission_date`, `status`), media (`photo_url`), auth linkage (`user_id`), and access credentials (`parent_id`, `parent_code`, `public_token uuid not null`, `is_verified boolean not null`).
4 policies. `public_token` is the unguessable key behind `/s/:token`.

**`classes`** (rows: **13**) — `name, level, arm, room, grade_level, school_type, specialization, capacity, class_teacher_id → teachers, programme_id → programmes`. The 13 arms mirror `CLASS_STRUCTURE` in `src/lib/schoolConfig.ts`.

**`teachers`** (rows: 0) — `employee_id, first_name, last_name, email, phone, address, bio, department, qualification, date_of_birth, gender, photo_url, status, hire_date, user_id`. Read through `staff_teacher_records()` to avoid exposing the full staff directory.

**`subjects`** (0) — `name, code`. **`programmes`** (0) — `name, description`.
**`terms`** (0) — `name, session, term_number, start_date, end_date, is_current`.
**`class_subjects`** (0) — the class × subject × teacher assignment join.
**`schedules`** (0) — `class_id, subject_id, teacher_id, day_of_week int, start_time, end_time, room`.

**`grades`** (0) — `student_id, class_id, subject_id, term_id, continuous_assessment, exam_score, total_score, letter_grade, remark, status, entered_by`. The last three of the numeric/derived columns are **computed by the `grades_compute` trigger** and should never be written directly by clients.

**`term_results`** (0) — `student_id, term_id, gpa, average, class_position, class_size, teacher_comment, principal_comment, is_published`. `is_published` is the publish gate for pupil, parent and public visibility.

**`attendance`** (0) — `student_id, class_id, date, status, notes, marked_by`. Read policy is `can_view_student(student_id)`.

**`staff_attendance`** (0) — `teacher_id, user_id, date, clock_in, clock_out, is_late, notes`. DELETE denied.

### Assessment & coursework

**`exams`** (0) — `title, description, subject_id, class_id, duration_minutes, start_time, end_time, is_published, status, created_by`.
**`exam_questions`** (0) — `exam_id, question_text, options jsonb, correct_index, points`. **Staff-only read**; students go through the RPC.
**`exam_submissions`** (0) — `exam_id, student_id, answers jsonb, score, submitted_at`. Single ALL policy scoped by `can_view_student`.
**`assignments`** (0) / **`assignment_submissions`** (0) — homework and its returns, with `score`, `feedback`, `status`.
**`lesson_plans`** (0) — `teacher_id, class_id, subject_id, date, topic, objectives, activities, resources, homework_assigned, status`.
**`academic_resources`** (0) — `title, description, file_url, subject_id, class_id, is_published, uploaded_by`.

### Finance

**`fee_items`** (0) — `name, amount, term_id, class_id`.
**`fee_payments`** (0) — `student_id, fee_item_id, amount_paid, method, reference, status, paid_at`.
**`payment_proofs`** (0) — `student_id, uploaded_by, fee_item_id, amount, reference, file_url, note, status, reviewed_by, reviewed_at`. DELETE denied.

### Communication & community

**`announcements`** (0) — `title, body, target_role, priority, is_published, created_by`.
**`notifications`** (0) — `user_id, title, body, type, link, is_read`. DELETE denied. Realtime consumer exists.
**`messages`** (0) — `sender_id, receiver_id, subject, body, is_read`. DELETE denied.
**`complaints`** (0) — `user_id, subject, description, priority, status, response`. Own-or-staff read; staff-only update; DELETE denied.
**`forum_posts` / `forum_replies`** (0) — UPDATE denied on both (posts are immutable once made).
**`wall_posts` / `wall_comments` / `wall_reactions`** (0) — the community wall. UPDATE denied on all three.

### Operations & records

**`applications`** (0) — the public admission form target. Anonymous INSERT allowed; staff-only read and manage. Includes `application_id`, `status`, `reviewed_by`, `reviewed_at`, `generated_student_id`, `rejection_reason`.
**`certificates`** (1) — `student_id, type, serial_number, issued_on`. 3 policies including **`anon SELECT USING (true)`**.
**`activity_logs`** (0) — `user_id, action, entity, entity_id, details`. Staff-only read; INSERT allowed when `user_id = auth.uid()` or the caller is staff.
**`behavioral_records`** (0), **`counseling_sessions`** (0) — pastoral records, `can_view_student` scoped read.
**`library_books`** (0) / **`book_issues`** (0) — catalogue and loans.
**`inventory_items`** (0), **`transport_routes`** (0), **`visitor_log`** (0), **`school_events`** (0), **`substitutions`** (0), **`leave_requests`** (0), **`school_settings`** (0, key/value).

## 5.4 Policy patterns

Four repeating patterns cover almost every table:

1. **Staff-managed reference data** — `ALL USING is_staff(auth.uid())` + `SELECT USING true` for authenticated. Used by: classes, subjects, class_subjects, announcements, assignments, academic_resources.
2. **Pupil-scoped records** — `ALL USING is_staff(...)` + `SELECT USING can_view_student(student_id)`. Used by: attendance, behavioral_records, book_issues, certificates, counseling_sessions.
3. **Own-record tables** — `USING user_id = auth.uid()` with a staff escape hatch. Used by: complaints, profiles, staff_attendance, notifications, messages.
4. **Immutable social content** — INSERT + SELECT allowed, UPDATE (and sometimes DELETE) denied. Used by: forum and wall tables.

## 5.5 Indexes, constraints, validation at the DB layer

- Primary keys on every `id`.
- UNIQUE on `user_roles (user_id, role)`.
- Foreign keys as listed per table above (all pointing at `public` tables; none at `auth.users`).
- **No CHECK constraints on score ranges** — the DB will happily store `continuous_assessment = 500`.
- **No UNIQUE constraint on `students.student_id`** (admission number) — duplicates are possible at the DB level.
- **No UNIQUE constraint on `students.parent_id`** — intentional, since siblings share a Parent ID, but it also means collisions between unrelated families are not prevented.
- **No UNIQUE constraint on `certificates.serial_number`**.
- No materialised views; no regular views.

## 5.6 Generated / computed fields

| Field | How |
|---|---|
| `grades.total_score` | trigger: `COALESCE(ca,0) + COALESCE(exam,0)` |
| `grades.letter_grade` | trigger: banded A–F |
| `grades.remark` | trigger: banded text |
| `*.updated_at` | trigger on 19 tables |
| `students.public_token` | column default (uuid) |
| `students.parent_id` / `parent_code` | generated **in the client** by `AdminIDCards.ensureParentAccess()` |
| Public attendance counts | computed inside `public_student_profile()` |

---

# 6. FEATURES

Status legend: **Complete** · **Mostly complete** · **Needs work** · **UI only** · **Backend only** · **Broken** · **Unused**

### 6.1 Authentication & session — Mostly complete
Purpose: sign in staff/students, resolve role, gate routes. Pages: `/login`, `/reset-password`, `ProtectedRoute`, `useAuth`. Tables: `auth.users`, `profiles`, `user_roles`. Edge cases handled: auth-callback deadlock (deferred fetch), unconfirmed email, `next` redirect (same-origin only). Gap: the sign-up toggle remains in the UI; leaked-password protection is off in the Supabase dashboard.

### 6.2 Parent ID access — Complete
Purpose: password-free parent entry. Pages: `/parent-access`, `/admin/id-cards`. Tables: `students`, `user_roles`, `parent_student_links`. Edge cases: siblings under one ID (all matching pupils are linked); repeated logins reset the password idempotently. Weakness: the derived password is fully determined by the printed ID + code, so possession of the card is possession of the account.

### 6.3 Admission applications — Mostly complete
`/apply` → `applications` → `/admin/approvals` or `/staff/admissions` → `students`. No email acknowledgement is sent (no email provider).

### 6.4 Register bulk import — Complete
Paste, parse, edit, seed classes, DOB-based class suggestion, bulk insert. Proven in production: 132 pupils imported.

### 6.5 Student records management — Complete
`/admin/students` + `StudentFormDialog`: create/edit bio, guardian, class, photo upload with signed URL, age-to-class suggestion.

### 6.6 Staff records management — Mostly complete
`/admin/staff` + `StaffFormDialog`, reading through `staff_teacher_records()`. `teachers` currently has 0 rows, so the school's 15 named teachers in `STAFF_ASSIGNMENTS` exist only as a constant in `schoolConfig.ts`.

### 6.7 Attendance (pupils) — Complete (backend + UI), unused (no data)
Daily register per class with present/absent/late, feeding pupil, parent and public views.

### 6.8 Staff geofenced clock-in — Complete
400 m Haversine geofence around 6.5095 N, 3.3596 E; late after 07:45; one row per user per day. Edge cases: geolocation unsupported, permission denied, 15 s timeout — all surface as toasts. Weakness: browser geolocation is spoofable.

### 6.9 Gradebook & grade computation — Complete
Class × subject × term marks grid; the trigger derives total, letter and remark. **Note the documented school scale and the implemented DB scale differ** — see 10.1.

### 6.10 Report cards (database path) — Mostly complete
`term_results` with average, position, comments and `is_published`. Publishing gates pupil, parent and public views.

### 6.11 Report card editor (print path) — UI only
`ReportCardEditor` reproduces the school's paper report exactly: header block, 12 subject rows (CA 40 / Exam 60), affective traits and psychomotor skills on a 1–5 scale, position, class-teacher and head-teacher comments, print CSS, `localStorage` draft. **It never reads or writes Supabase.**

### 6.12 CBT examinations — Needs work
Authoring, publishing, secure question delivery, resumable sessions, auto-save and auto-submit all work. **Auto-scoring does not exist**, so `exam_submissions.score` is always NULL and no results flow back into `grades`.

### 6.13 Homework / assignments — Mostly complete
Create, list, submit, score, feedback. File attachment is a URL text field, not a storage upload.

### 6.14 Lesson plans — Complete (CRUD)

### 6.15 Fees — Needs work
Billing items, payment records, proof uploads and an intelligence dashboard exist. There is **no payment gateway**, and the "monthly collection trend" in `/admin/financial` is explicitly generated mock data.

### 6.16 ID cards — Complete
Portrait two-sided cards, crest on white circular backing, passport photo, QR to the public profile, Parent ID + access code on the reverse, lazy credential generation, print.

### 6.17 Certificates — Mostly complete
Issue by type with a serial number; QR + `/verify` lookup. Security gap: anonymous SELECT on the whole table.

### 6.18 Public student profile — Complete
Token-based, published-results-only, safe by construction via SECURITY DEFINER RPCs.

### 6.19 Community wall — Complete
Shared `CommunityWall` across student, staff and parent portals; posts, comments, reactions; posts immutable by policy.

### 6.20 Forum — Complete (staff and parent)

### 6.21 Messaging — Mostly complete
Direct `messages` between users; `is_read`; no attachments, no threading, no realtime subscription.

### 6.22 Notifications — Mostly complete
Table + realtime hook + dropdown exist; only the predictive analytics page writes notifications.

### 6.23 Complaints — Complete

### 6.24 Announcements — Complete
`target_role` + `priority` + `is_published`.

### 6.25 Library — Complete (CRUD)
Catalogue with quantity/available and per-pupil issues.

### 6.26 Transport, Visitors, Inventory, Substitutions, Wellbeing, Behavioural records — Complete as CRUD, unused (all 0 rows)

### 6.27 Analytics dashboards — Needs work
`/admin/analytics` computes class and grade aggregates but the enrolment trend is synthetic. `/admin/financial` likewise. `/admin/predictive` computes genuine at-risk signals from attendance, grades and submissions, and can notify guardians.

### 6.28 AI assistant — Mostly complete, mis-scoped
`AIChatWidget` (student portal) → `ai-assistant` edge function → Lovable AI Gateway. The system prompts describe a **"Nigerian secondary school"** tutor called **"NPS AI Tutor"** covering **WAEC/NECO** — wrong school phase and wrong brand for a nursery/primary school.

### 6.29 MCP agent integration — Complete in code, requires manual dashboard steps
Needs OAuth 2.1 with dynamic client registration enabled in the Supabase dashboard and the `mcp` function deployed.

### 6.30 Theming / dark mode — Complete

---

# 7. COMPONENT INVENTORY

## 7.1 Layout components (`src/components/layout/`)

| Component | Used by | Notes |
|---|---|---|
| `StudentLayout` | all `/student/*` | Sidebar (14 items) + MobileHeader + Sheet + BottomNavigation + AIChatWidget |
| `StaffLayout` | all `/staff/*` | Sidebar (16 items) |
| `AdminLayout` | all `/admin/*` | Sectioned sidebar (7 groups), header search, portal-switch links |
| `ParentLayout` | all `/parent/*` | Sidebar (8 items) |
| `MobileHeader` | all four layouts | Hamburger → `Sheet` drawer, title, notifications |
| `BottomNavigation` | StudentLayout | Fixed bottom bar, `md:hidden`, 5 items |
| `DashboardLayout` | **nobody** | Legacy; references non-existent routes |
| `Sidebar` | **nobody** | Legacy, only imported by `DashboardLayout` |
| `Header` | **nobody** | Legacy, only imported by `DashboardLayout` |

## 7.2 Feature components (`src/components/`)

| Component | Used by | Purpose |
|---|---|---|
| `ProtectedRoute` | App.tsx (66 routes) | Role gate + loading spinner; admin bypass |
| `ErrorBoundary` | App.tsx | Class component; catches render errors, offers "Try Again" |
| `CommunityWall` | StudentWall, StaffWall, ParentWall | Shared social feed |
| `AIChatWidget` | StudentLayout | Floating tutor chat |
| `QRScanner` | Login | `html5-qrcode` camera wrapper |
| `StaffClockIn` | StaffDashboard | Geofenced attendance card |
| `NotificationDropdown` | all layouts | Bell + unread badge + list |
| `ThemeToggle` | all layouts | next-themes light/dark switch |
| `SchoolInfoPanel` | dashboards | Motto, grading key, term calendar |
| `NavLink` | sidebars | Active-state link |
| `admin/StudentFormDialog` | AdminStudentsPage | Create/edit pupil + photo upload |
| `admin/StaffFormDialog` | AdminStaffPage | Create/edit staff |
| `profile/ProfileShared` | profile pages | Shared profile blocks |
| `reports/ReportCardEditor` | StaffReportCard | Editable/printable report card |

## 7.3 UI primitives (`src/components/ui/`, 50 files)

Standard shadcn set — accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip.

Three **project-specific** additions:
- `empty-state.tsx` — icon + heading + description + optional action.
- `grade-badge.tsx` — colour-coded letter grade chip using the `grade-*` tokens.
- `loading-skeleton.tsx` and `stat-card.tsx` — dashboard KPI tile (icon, label, value, delta).

`pagination.tsx` exists but no page uses it.

## 7.4 Hooks and libraries

| File | Purpose |
|---|---|
| `hooks/useAuth.tsx` | Auth context: user, session, role, studentData, teacherData, signIn/signUp/signOut |
| `hooks/useRealtimeNotifications.tsx` | Realtime channel on `notifications` with proper `removeChannel` cleanup |
| `hooks/use-mobile.tsx` | Breakpoint hook |
| `hooks/use-toast.ts` | shadcn toast store |
| `lib/schoolConfig.ts` | Single source of truth for school identity, terms, subjects, grade bands, class structure, staff assignments, rating keys, geofence |
| `lib/studentUtils.ts` | Age ladder, DOB→level/class suggestion, Parent ID/code generators, photo upload |
| `lib/utils.ts` | `cn()` |
| `lib/mcp/*` | MCP server definition, RLS-aware Supabase client, 5 tools |
| `integrations/supabase/client.ts` | Configured supabase-js client |
| `integrations/supabase/types.ts` | Generated DB types (do not hand-edit) |

---

# 8. DESIGN SYSTEM

## 8.1 Brand

Primary brand colour is **sky blue**, supported by a deeper navy and a gold/amber accent. The school crest is imported as a data-URI module (`src/assets/logo.ts`) and is placed on a white circular backing wherever it sits on a coloured field (notably ID cards).

## 8.2 Colour tokens (HSL, light theme, from `src/index.css`)

| Token | Value | Role |
|---|---|---|
| `--primary` | `199 92% 56%` | Sky blue — buttons, links, active nav |
| `--primary-light` | `199 94% 70%` | Hover/soft fills |
| `--primary-soft` | `199 90% 96%` | Page-level tints, login gradient |
| `--navy` | `205 60% 30%` | Headers, ID-card bands |
| `--secondary` | `202 75% 38%` | Deep sky |
| `--accent` | `43 80% 48%` | Gold |
| `--background` | `205 40% 98%` | Airy off-white |
| `--foreground` | `200 15% 15%` | Body text |
| `--card` / `--surface` | `0 0% 100%` | White surfaces |
| `--muted` | `205 25% 95%` | Muted fills |
| `--muted-foreground` | `215 10% 50%` | Secondary text |
| `--border` | `205 30% 89%` | Hairlines |
| `--input` | `205 25% 90%` | Field borders |
| `--ring` | `199 92% 56%` | Focus ring |
| `--success` | `152 60% 42%` | |
| `--warning` | `38 85% 52%` | |
| `--destructive` | `0 70% 55%` | |
| `--info` | `210 75% 55%` | |
| Grade colours | excellent `152 60% 42%`, very-good `210 75% 55%`, good `38 85% 52%`, fail `0 70% 55%` | Grade badges |
| Feature colours | orange `43 80% 48%`, purple `260 55% 60%`, pink `330 55% 58%`, teal `205 85% 52%` | Category tiles |
| Sidebar | bg `200 85% 44%`, fg `0 0% 100%`, accent `199 92% 56%`, border `199 70% 58%` | Solid sky-blue sidebar with white text |
| Charts | `199 92% 56%`, `43 80% 48%`, `205 85% 52%`, `0 70% 55%`, `260 55% 60%` | recharts series |

## 8.3 Dark theme

Activated by the `.dark` class (next-themes, class strategy). Background drops to `200 15% 7%`, cards to `200 15% 11%`, primary brightens to `202 90% 58%`, the sidebar becomes near-black `200 15% 10%` with muted grey text. `disableTransitionOnChange` is set to prevent a colour flash on toggle.

## 8.4 Typography

- Body: **Inter** (`font-family: 'Inter', system-ui, sans-serif` on `body`, and `fontFamily.sans` in Tailwind).
- Headings `h1`–`h6`: **Plus Jakarta Sans** falling back to Inter.
- Fonts are **preloaded in `index.html`** with `font-display: swap` to avoid the slow-font flash.
- Monospace is used for identity strings: Parent ID, access code, and the exam timer (`font-mono`).
- Note: `tailwind.config.ts` sets `fontFamily.display` to Inter, which contradicts the CSS heading rule — the CSS rule wins for real headings.

## 8.5 Spacing, radius, elevation

- Radius: `--radius: 0.75rem`; Tailwind `lg = var(--radius)`, `md = radius - 2px`, `sm = radius - 4px`, `xl = 0.75rem`, `2xl = 1rem`. Cards are consistently `rounded-xl`.
- Container: centred, `padding: 2rem`, `2xl` max width 1400px.
- Page padding: `p-4 md:p-6 lg:p-8`.
- Vertical rhythm: `space-y-4` inside cards, `space-y-6` between page sections.
- Shadows: `soft`, `medium`, `glow` (`0 0 40px -10px hsl(var(--primary)/0.3)`), and `card` (the default for content cards).

## 8.6 Motion

Keyframes in both `index.css` and the Tailwind config: `fade-in`, `fade-up` (20 px rise), `scale-in` (0.95→1), `slide-in-left`, `slide-in-right`, plus Radix `accordion-down`/`accordion-up` (0.2 s ease-out). Ad-hoc animation: `animate-spin` loaders and `animate-pulse` on the sub-5-minute exam timer.

## 8.7 Responsive behaviour

Default Tailwind breakpoints (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1400` container cap). Rules observed throughout:
- `md` is the desktop/mobile switch: sidebars are `hidden md:flex`, `BottomNavigation` is `md:hidden`.
- Tables collapse to stacked cards or gain `overflow-x-auto` on small screens.
- Dialogs become full-width sheets on mobile.
- The current preview viewport (394 × 682) exercises the mobile path.

## 8.8 Visual hierarchy conventions

1. Coloured sidebar (sky blue) anchors the left edge; content sits on a near-white background.
2. Page title in the header; section titles as `CardTitle`.
3. KPI row of `StatCard`s at the top of every dashboard.
4. Primary action buttons are solid sky blue; secondary are `variant="outline"`; destructive are red; success actions (e.g. Submit Exam) use the success token.
5. Status is always communicated with a `Badge`, never colour alone in text.
6. Scrollbars are thinned with the `.scrollbar-thin` utility.

---

# 9. VALIDATION RULES

## 9.1 Implemented in the client

| Rule | Where | Detail |
|---|---|---|
| Email format | Login, Register, Apply | zod `.email()` — "Please enter a valid email address" |
| Password length | Login, Register | ≥ 6 characters |
| Password confirmation | Register | zod `.refine` equality, error attached to `confirmPassword` |
| Required names/phone | Register, Apply | non-empty strings |
| Parent ID length | ParentAccess | ≥ 4 chars client-side; edge function enforces 4–32 |
| Access code length | ParentAccess | ≥ 4 chars client-side; edge function enforces 4–32 |
| Case normalisation | ParentAccess + edge fn | both values forced to uppercase on input and again on the server |
| Parent-login body | `parent-login` edge fn | zod `{parentId: string 4–32 trimmed, code: string 4–32 trimmed}` |
| QR payload | Login `handleScan` | must match `/s/<36-char uuid>` or a bare 36-char uuid, or be a same-origin URL |
| Geofence | StaffClockIn | distance ≤ 400 m, else rejected with the measured distance |
| Clock-in lateness | StaffClockIn | `now > 07:45` sets `is_late` |
| Exam re-entry | TakeExam | a submission with `submitted_at` set cannot be reopened |
| Exam auto-submit | TakeExam | forced at `timeLeft === 0` |
| Photo upload | `uploadStudentPhoto` | extension derived from filename, defaults to `jpg`; `upsert: true`; returns null on failure |
| Report card scores | ReportCardEditor | numeric fields, CA weighted 40 / exam 60, remark auto-derived from `remarkForScore()` |
| Age → class | `suggestLevelForDob` | returns null for missing/invalid/negative age |

## 9.2 Enforced by the database

| Rule | Mechanism |
|---|---|
| One role row per (user, role) | UNIQUE `(user_id, role)` on `user_roles` |
| Roles immutable from the client | `user_roles` has SELECT-only policy |
| Grade totals/letters/remarks cannot be forged | `grades_compute` overwrites them on every INSERT/UPDATE |
| Timestamps cannot drift | `set_updated_at` triggers |
| Pupil data isolation | `can_view_student()` in every pupil-scoped SELECT policy |
| Answer-key secrecy | `exam_questions` staff-only; `student_exam_questions()` omits `correct_index` |
| Unpublished results hidden | `public_student_results()` filters on `term_results.is_published` |
| Row-level tenancy | RLS on all 49 tables, auto-enabled by `rls_auto_enable` event trigger |

## 9.3 Missing validation (confirmed absent)

- **Admission number uniqueness** — no UNIQUE index on `students.student_id`, no client duplicate check in the register importer.
- **Score bounds** — nothing prevents `continuous_assessment > 40`, `exam_score > 60`, or negatives, in the client or the DB.
- **Class capacity** — `classes.capacity` exists but is never compared against enrolment.
- **Date sanity** — no rule that `date_of_birth` is in the past, that `terms.end_date > start_date`, or that `leave_requests.end_date >= start_date`.
- **Phone format** — Nigerian numbers are accepted as free text with no pattern.
- **Attendance duplicates** — no unique constraint on `(student_id, date)`.
- **Fee over-payment** — `amount_paid` is not compared with the billed `fee_items.amount`.
- **Certificate serial uniqueness** — not constrained.
- **Password strength / leaked-password protection** — disabled in the Supabase dashboard (a known outstanding security item).

---

# 10. BUSINESS RULES

## 10.1 Grading — two competing scales (important)

**Scale documented by the school and implemented in `src/lib/schoolConfig.ts` (`GRADE_BANDS`, used by the printable report card):**

| Score | Remark |
|---|---|
| 90–100 | Outstanding |
| 80–89 | Excellent |
| 70–79 | Very Good |
| 60–69 | Very Good |
| 50–59 | Good |
| 40–49 | Fair |
| 0–39 | Poor |

**Scale implemented in the database trigger `compute_grade_fields()` (used by the gradebook):**

| Total | Letter | Remark |
|---|---|---|
| ≥ 90 | A | Outstanding |
| ≥ 80 | B | Excellent |
| ≥ 70 | C | Very Good |
| ≥ 60 | D | Very Good |
| ≥ 50 | E | Good |
| ≥ 40 | — (F) | Fair |
| < 40 | F | Poor |

The remark bands agree. The letter grades are an addition present only in the DB. A rebuild should pick one canonical definition and derive both from it.

## 10.2 Assessment weighting
`ASSESSMENT_WEIGHTS = { ca: 40, exam: 60, total: 100 }`. Total score = CA + Exam. The DB trigger sums the two columns without enforcing the individual caps.

## 10.3 Promotion
`PROMOTION_AVERAGE = 60`. A pupil with a termly/annual average of 60 or above is promoted. **This rule is defined as a constant and displayed in the report card, but no automated promotion routine exists** — there is no "promote class" action anywhere in the app.

## 10.4 Academic calendar
Three named terms, fixed order:

| # | Name | Label | Months |
|---|---|---|---|
| 1 | Wisdom Term | 1st Term | September – December |
| 2 | Excellent Term | 2nd Term | January – April |
| 3 | Glorious Term | 3rd Term | April – July |

Holidays listed: Christmas, Easter, Muslim Holidays, Democracy Day, Independence Day. Current session string: **2026/2027 Academic Session**. `terms.is_current` is the intended runtime switch, but the `terms` table is empty, so the app currently relies on the constants.

## 10.5 Class structure (13 arms)

| Level | Arms |
|---|---|
| Kindergarten One | Faith |
| Kindergarten Two | Joy, Hope |
| Nursery One | Pearl |
| Nursery Two | Gift, Love |
| Grade One | Emerald, Peace |
| Grade Two | Topaz |
| Grade Three | Ruby |
| Grade Four | Sapphire |
| Grade Five | Zircon |
| Grade Six | Diamond |

Display format is `"<Level> (<Arm>)"`.

## 10.6 Age-to-class placement ladder
Used only as an editable **suggestion** during import and pupil creation:

`≤4 → Kindergarten One`, `≤5 → Kindergarten Two`, `≤6 → Nursery One`, `≤7 → Nursery Two`, `≤8 → Grade One`, `≤9 → Grade Two`, `≤10 → Grade Three`, `≤11 → Grade Four`, `≤12 → Grade Five`, otherwise `Grade Six`.

## 10.7 Report card rating scales
- **Affective traits:** Punctuality, Neatness, Helping others, Attitude to work, Leadership, Attentiveness.
- **Psychomotor skills:** Verbal Fluency, Games, Sports, Drawing.
- **Rating key:** 5 Excellent, 4 Good, 3 Average, 2 Fair, 1 Poor.

## 10.8 Result approval / publication
`term_results.is_published` is the single gate. While false, the pupil, the parent, and the public profile all see nothing. There is no multi-step approval workflow (no "submitted → head teacher approved → published" chain), despite `admin_permissions.can_approve_grades` existing as a flag.

## 10.9 Parent linking
1. Each pupil carries a `parent_id` (`IMS-P-` + 6 chars) and a `parent_code` (6 chars) from the ambiguity-free alphabet.
2. Credentials are generated lazily on ID-card render and persisted.
3. On login, **every** pupil sharing that `parent_id` is linked to the parent account — this is the sibling mechanism.
4. Two guardians may share one ID (documented on the login screen); there is no per-guardian identity.

## 10.10 Attendance percentage
`present / total` where both are counted from the `attendance` table for that pupil. Computed in `public_student_profile()` for the public card and re-derived client-side in the pupil and parent views.

## 10.11 Staff punctuality
Cutoff **07:45**. Clock-in outside the 400 m campus geofence is refused outright. One `staff_attendance` row per user per calendar date.

## 10.12 QR / public token
`students.public_token` is a non-null random UUID assigned at row creation. It is the only credential needed to view the public profile, so it functions as a capability URL. It is never rotated.

## 10.13 Subjects offered (21)
Mathematics, English Language, Quantitative Aptitude, Verbal Aptitude, IRK, CRK, Basic Science, Coding, ICT, Creative Art, Vocational Aptitude, French, Diction, Music, Abacus, Yoruba, Phonics, Handwriting, History, Physical & Health Education, National Value.

The report card editor defaults to the **first 12** of these.

## 10.14 School identity constants
Name: Imagemakers Nursery and Primary School · Motto: **"Imparting Wisdom and Morals"** · Approval: LASG APPROVAL NO: SLR/14097 · Address: 38E Nathan Street, Off Ojuelegba Road, By Surulere Baptist Church, Surulere, Lagos · Email: imagemakersschool123@gmail.com · Phones: 08138062345, 08054389290 · Coordinates: 6.5095 N, 3.3596 E.

---

# 11. ERROR ANALYSIS

Severity: **Critical** (data loss / security / unusable) · **High** (feature broken) · **Medium** (confusing or wasteful) · **Low** (cosmetic)

| # | Severity | Location | Issue | Cause | Suggested fix |
|---|---|---|---|---|---|
| 1 | Critical | `certificates` RLS | Policy `public verify certificate` grants `anon` SELECT with `USING (true)` — the entire certificate table is anonymously enumerable | Verification was implemented as a blanket read instead of a lookup function | Replace with a SECURITY DEFINER `verify_certificate(_serial text)` returning one row, and drop the anon SELECT policy |
| 2 | Critical | Supabase dashboard | Leaked-password protection is disabled | Never toggled | Enable in Authentication → Password protection |
| 3 | High | `src/pages/student/TakeExam.tsx` `handleSubmit` | CBT exams are never scored. `totalPoints`/`earned` are computed into unused locals; only `{answers, submitted_at}` is written | Scoring was deliberately deferred to "server-side in a real app" and never built | Add a SECURITY DEFINER `grade_exam_submission(_submission_id)` that compares `answers` to `exam_questions.correct_index` and writes `score`; call it on submit |
| 4 | High | RLS across all staff tables | `is_staff()` gives every teacher school-wide access to all 132 pupils, all grades, and all answer keys — no class scoping | Single blunt helper used everywhere | Add `teaches_class(_class_id)` (via `class_subjects` / `classes.class_teacher_id`) and use it in teacher-facing policies, keeping `has_role(admin)` as the wide escape hatch |
| 5 | High | `admin_permissions` | The 7 capability flags are edited in the UI but enforced nowhere | UI shipped ahead of policy work | Either enforce them in RLS via a `has_permission(uid, flag)` definer function, or remove the screen |
| 6 | High | `src/pages/Login.tsx` line ~438 | A "register" toggle still exposes self sign-up, contradicting the ID-card-only access model; anyone can create an account which defaults to role `student` | Removal was partial | Remove the toggle and the `registerSchema` path, or restrict sign-up to staff with an invite code |
| 7 | Medium | `src/pages/Index.tsx` | Unreferenced marketing homepage — never imported by `App.tsx` | `/` was repointed to `/login` | Delete, or restore as the public landing page |
| 8 | Medium | `layout/DashboardLayout.tsx`, `layout/Sidebar.tsx`, `layout/Header.tsx` | Three unused legacy layout files whose nav points at four routes that do not exist (`/student/classes`, `/student/messages`, `/staff/teachers`, `/staff/system`) — each would render the 404 page | Superseded by the four portal layouts | Delete all three |
| 9 | Medium | `src/pages/admin/AdminAnalytics.tsx`, `AdminFinancialIntelligence.tsx` | Charts present fabricated trend data as if it were real (source comments say "mock") | No historical snapshots exist | Either build an `enrolment_snapshots` table or label the charts as illustrative |
| 10 | Medium | `supabase/functions/ai-assistant/index.ts` | Prompts describe "NPS AI Tutor", "Nigerian secondary school", "WAEC/NECO" — wrong brand and wrong school phase for a nursery/primary school | Prompt carried over from a different project | Rewrite for ages 3–12 and Imagemakers branding |
| 11 | Medium | `src/lib/studentUtils.ts` `uploadStudentPhoto` | Stores a 365-day signed URL in `students.photo_url`; every pupil photo breaks one year after upload | Signed URL persisted instead of the storage path | Store the object path and mint short-lived signed URLs on read |
| 12 | Medium | `students.student_id` | No UNIQUE constraint on the admission number; the bulk importer can create duplicates silently | Constraint omitted from the migration | Add a UNIQUE index and a pre-import duplicate check |
| 13 | Medium | `grades` | No CHECK/bounds on `continuous_assessment` (should be 0–40) or `exam_score` (0–60) | Validation left to the UI, which does not do it either | Add a validation trigger (not a CHECK, to stay migration-safe) plus client `min`/`max` |
| 14 | Medium | `src/pages/staff/StaffReportCard.tsx` + `ReportCardEditor` | The report card editor persists only to `localStorage`; drafts are per-browser, lost on cache clear, and invisible to other staff | Built as a standalone print tool | Persist to `term_results` + a new `report_card_drafts` table, and prefill subjects/scores from `grades` |
| 15 | Medium | Grading definitions | Two grade scales coexist (`GRADE_BANDS` in TS vs `compute_grade_fields()` in SQL); a change to one silently diverges from the other | Duplication | Make SQL canonical and expose the bands via a small RPC or generated constant |
| 16 | Medium | Whole app | React Query is installed and mounted but no query uses it; every page does raw `useEffect` + `supabase.from()` with no caching, deduping, retry, or `AbortController` | Incremental development | Migrate list pages to `useQuery` |
| 17 | Medium | Whole app | No pagination anywhere; every list fetches all rows and Supabase silently caps at 1000. At 132 pupils this is fine, at 1000+ it silently truncates | Pagination never implemented | Use `.range()` + the existing `pagination.tsx` primitive |
| 18 | Medium | `payment_proofs`, `academic_resources`, `assignment_submissions` | `file_url` is a bare text column with no storage bucket behind it — "file upload" for these features cannot actually store a file | Only `student-photos` was provisioned | Create buckets and wire real uploads |
| 19 | Medium | `attendance` | No unique constraint on `(student_id, date)`; re-saving a register can create duplicate rows and skew every attendance percentage | Constraint omitted | Add a UNIQUE index and switch the save to an upsert on that key |
| 20 | Low | Data state | 42 of 49 tables are empty. Library, transport, inventory, visitors, substitutions, wellbeing, forum, wall, messages, notifications, terms, subjects, teachers and programmes all render permanent empty states | Never seeded | Seed `terms`, `subjects`, `programmes` and the 15 known `teachers` from `schoolConfig.ts` at minimum |
| 21 | Low | Toast systems | Both shadcn `useToast` and sonner are mounted and used on different pages, producing two visually different notification styles | Two libraries adopted | Standardise on sonner |
| 22 | Low | `tailwind.config.ts` vs `index.css` | `fontFamily.display` is Inter while headings are styled Plus Jakarta Sans in CSS | Inconsistent config | Set `display: ["Plus Jakarta Sans", ...]` |
| 23 | Low | Accessibility | Colour-only status in some tables; icon-only buttons in card toolbars lacking `aria-label`; the exam option buttons are `<button>` rather than a labelled radio group, so screen readers do not announce group membership or selected state | Not audited | Add `aria-label`s, use `role="radiogroup"`/`aria-checked`, keep text alongside colour |
| 24 | Low | `ProtectedRoute` | Role gating is client-side only; the real barrier is RLS. A user can briefly render another portal's shell before the redirect fires | By design, but visually leaky | Render `null` until `isLoading` resolves for the role too |
| 25 | Low | Parent credential model | The parent password is deterministically `<PARENTID>#<CODE>#ims`; anyone who photographs the card back owns the account permanently, and there is no rotation UI | Simplicity chosen over security | Add an admin "regenerate access code" action and treat the code as rotatable |

## 11.1 Console / runtime

No unhandled runtime errors were reproduced during this review. The `ErrorBoundary` wrapping `<Routes>` means any future render crash degrades to a "Try Again" card rather than a blank screen. The previously reported blank-page crash on the wall pages was caused by querying a non-existent `is_pinned` column and has been removed from `CommunityWall`.

## 11.2 Performance

- 76 page components are **statically imported** in `App.tsx` — no route-level code splitting, so the initial bundle contains the entire admin portal even for a pupil.
- Dashboards issue 6–8 sequential/parallel Supabase round trips per mount with no caching.
- Charts and `recharts` are loaded eagerly.
- Fonts are preloaded with `font-display: swap` (already optimised).

---

# 12. FEATURE COMPLETENESS MATRIX

| Feature | Status |
|---|---|
| Email/password authentication | Complete |
| Role resolution & route gating | Complete (client-side only) |
| Parent ID + access code login | Complete |
| Password reset | Complete |
| Self sign-up removal | **Needs work** (toggle still present) |
| Public admission application | Complete |
| Application review → enrolment | Mostly complete |
| Admission register bulk import | Complete |
| Student CRUD + photo upload | Complete |
| Staff CRUD | Mostly complete (no staff data) |
| Class management | Complete |
| Subjects / programmes / terms setup | **Backend only** (tables empty, admin screen exists) |
| Timetable / schedules | Mostly complete (no data) |
| Pupil attendance register | Complete |
| Staff geofenced clock-in | Complete |
| Gradebook marks entry | Complete |
| Automatic grade computation | Complete |
| Term results + publication gate | Mostly complete |
| Printable report card editor | **UI only** (localStorage, no DB) |
| Automated promotion | **Missing** |
| CBT authoring & delivery | Mostly complete |
| CBT auto-scoring | **Missing** |
| Homework assign/submit/score | Mostly complete |
| Lesson plans | Complete |
| Academic resources | Mostly complete (no storage bucket) |
| Fee items & payment records | Mostly complete |
| Payment proof review | Mostly complete (no bucket) |
| Online payment collection | **Missing** (no provider) |
| Financial intelligence dashboard | **Needs work** (mock trend) |
| Admin analytics | **Needs work** (mock trend) |
| Predictive at-risk analytics | Complete |
| Behavioural records | Complete (unused) |
| Wellbeing / counselling | Complete (unused) |
| ID card generation & printing | Complete |
| Parent credential generation | Complete |
| Public student profile via QR | Complete |
| QR scanning at login | Complete |
| Certificates + verification | Mostly complete (security gap) |
| Announcements | Complete |
| Notifications + realtime | Mostly complete |
| Direct messaging | Mostly complete |
| Forum (staff, parent) | Complete |
| Community wall | Complete |
| Complaints | Complete |
| Library catalogue & issues | Complete (unused) |
| Transport / Visitors / Inventory / Substitutions | Complete CRUD (unused) |
| Activity logs | **Backend only** (nothing writes them) |
| Admin permission flags | **UI only** (not enforced) |
| AI homework tutor | Mostly complete (wrong prompt scope) |
| AI report comments | Mostly complete |
| MCP agent server | Complete in code, manual dashboard steps pending |
| Dark mode / theming | Complete |
| Email notifications | **Missing** |
| SMS notifications | **Missing** |
| Pagination | **Missing** |
| Route-level code splitting | **Missing** |

---

# 13. IMPROVEMENT OPPORTUNITIES

## 13.1 UX
- Add a **child switcher** in the parent portal header; siblings currently require navigating per page.
- Give the gradebook keyboard-grid navigation (Tab/Enter to advance), autosave, and a dirty-state indicator — teachers enter hundreds of marks per term.
- Add a global command palette (`command.tsx` is already installed) for admins with 26 sidebar destinations.
- Make every empty state actionable ("No subjects yet — Add your first subject") instead of a dead sentence.
- Show the school session and current term persistently in every header.
- Provide print previews for report cards and ID cards rather than firing `window.print()` blind.

## 13.2 Navigation
- Collapse the 26-item admin sidebar into collapsible sections with persisted open/closed state.
- Add breadcrumbs on deep admin pages (`breadcrumb.tsx` is already installed but unused).
- Remove the three dead legacy layouts so no future edit reintroduces the four phantom routes.

## 13.3 Accessibility
- Convert exam options to a proper `radiogroup` with `aria-checked`.
- Add `aria-label` to all icon-only buttons.
- Verify contrast of white text on `--primary` (`199 92% 56%`) — it is borderline for small text and likely fails WCAG AA at 14 px.
- Add a skip-to-content link and visible focus rings on the sidebar.
- Ensure the QR scanner dialog traps focus and announces camera state.

## 13.4 Performance
- `React.lazy` + `Suspense` per portal — a pupil should never download the admin bundle.
- Adopt React Query (already installed) for caching, deduping and background refetch.
- Paginate every list with `.range()`.
- Select explicit columns instead of `select("*")` on `students` (36 columns, 132 rows on several screens).

## 13.5 Code organisation
- Extract per-portal route groups into `routes/student.tsx`, `routes/staff.tsx`, etc., to shrink the 203-line `App.tsx`.
- Create a `src/data/` layer of typed query functions so pages stop embedding raw Supabase calls.
- Split `StaffGradebook` (561 lines) and `Apply` (688 lines) into sub-components.
- Standardise on one toast library.
- Derive the TS grade bands from the SQL definition to eliminate the duplicate scale.

## 13.6 Security
- Fix the anonymous certificate read (item 1 in section 11).
- Enable leaked-password protection.
- Scope teachers to their own classes.
- Enforce `admin_permissions` in RLS or delete the feature.
- Add an access-code rotation action and consider expiring `public_token` on demand.
- Write to `activity_logs` on every privileged mutation — the table and policies exist and are unused.

## 13.7 Scalability
- Add indexes on the hot foreign keys actually filtered in queries: `attendance(student_id, date)`, `grades(student_id, term_id)`, `students(class_id)`, `parent_student_links(parent_user_id)`.
- Introduce a `sessions`/academic-year dimension so multi-year history is queryable rather than overwritten.
- Snapshot enrolment monthly so trend charts stop being fabricated.

## 13.8 Maintainability
- Add automated tests: at minimum, the grade trigger, `can_view_student`, and the parent-login edge function.
- Seed script for reference data (terms, subjects, programmes, teachers).
- Document the two-scale grading decision in the codebase.

---

# 14. DESIGN REBUILD SPECIFICATION

Written for a design AI (Readdy AI / Google Stitch). Every screen below can be built from this section alone.

## 14.0 Global design language

- **Aesthetic:** clean, friendly, high-trust institutional. Bright sky blue on near-white. Generous whitespace, soft rounded corners, minimal shadows. Not playful-cartoonish despite being a primary school — the operators are adults.
- **Base palette:** primary sky `hsl(199 92% 56%)`, deep navy `hsl(205 60% 30%)`, gold accent `hsl(43 80% 48%)`, page background `hsl(205 40% 98%)`, card white, border `hsl(205 30% 89%)`, body text `hsl(200 15% 15%)`, secondary text `hsl(215 10% 50%)`.
- **Type:** headings Plus Jakarta Sans (600/700), body Inter (400/500), identity strings monospace.
- **Radius:** 12 px on cards, buttons and inputs; 16 px on large panels; full-round on avatars, chips and letter badges.
- **Shadow:** `0 1px 3px rgba(0,0,0,.1)` on cards; no heavy drop shadows.
- **Grid:** 12-column on desktop, single column under 768 px. Page padding 16 px mobile / 24 px tablet / 32 px desktop. Vertical gap 16 px within a card, 24 px between sections.
- **Buttons:** height 40 px, radius 12 px, 14 px semibold label. Primary = solid sky, white text. Secondary = white with a 1 px border. Destructive = solid red. Success = solid green.
- **Inputs:** height 40 px, 1 px border `hsl(205 25% 90%)`, radius 12 px, focus = 2 px sky ring, label 13 px medium above the field, error text 12 px red below.
- **Badges:** 22 px tall, radius full, 11 px semibold uppercase, tinted background at 10–15 % of the status colour with the status colour as text.
- **Tables:** white card, 1 px row dividers, 12 px uppercase muted column headers, 14 px body rows, 48 px row height, hover tint, `overflow-x-auto` on mobile.
- **Motion:** 200 ms ease-out. Content fades up 20 px on mount. Dialogs scale 0.95 → 1. Sidebar drawer slides from the left.

## 14.1 Login screen (`/login`)

Full-viewport gradient from `--primary-soft` at the top to background at the bottom. Centred card, max width 420 px, radius 16 px, white, soft shadow.

Vertical order inside the card:
1. School crest, 64 px, centred, on a white circular backing.
2. School name in 18 px semibold navy; below it "School Portal" in 13 px muted.
3. **User-type selector**: two side-by-side selectable tiles, each 1 px bordered, radius 12 px, 88 px tall — left tile a graduation-cap icon over "Student", right tile a briefcase icon over "Staff". Selected tile gets a 2 px sky border and a `--primary-soft` fill.
4. Email field, then password field with a trailing eye toggle.
5. "Forgot password?" right-aligned, 13 px, sky.
6. Primary full-width **Sign In** button.
7. A hairline divider with the word "or".
8. Secondary full-width outline button **Scan ID Card** with a QR icon.
9. Two tertiary links: "Parent? Use your Parent ID" → `/parent-access`, and "Apply for admission" → `/apply`.

QR dialog: 360 px square modal, live camera feed filling the body, a rounded square reticle overlay, caption "Point at the QR code on the back of the ID card", and a Cancel button.

Mobile: card takes full width minus 16 px gutters; the two type tiles stack only below 360 px.

## 14.2 Parent access (`/parent-access`)

Same gradient and card treatment, max width 420 px. Crest, a "Parent Access" title with a people icon, and helper copy: "Enter the Parent ID and access code printed on the back of your child's ID card. Two parents may use the same ID." Two monospace uppercase inputs — Parent ID with placeholder `IMS-P-XXXXXX`, Access code with placeholder `XXXXXX`. Full-width primary button **Open parent dashboard**. Bottom link with a left arrow: "Back to staff & student login".

## 14.3 Portal shell (all four portals)

**Desktop (≥ 768 px):**
- Fixed left sidebar, 260 px wide, full height, solid sky blue `hsl(200 85% 44%)`, white text.
  - Top: crest in a white circle + school short name.
  - Nav items: 40 px tall, 14 px medium, 20 px icon, 12 px gap, radius 10 px, 8 px horizontal inset. Active item = white 15 % overlay with a 3 px white left indicator bar. Hover = white 8 % overlay.
  - Admin sidebar only: section captions above each group — 10 px bold uppercase, letter-spacing 0.15 em, 70 % opacity white.
  - Bottom: avatar circle with initials, name, role, and a log-out icon button.
- Top bar, 64 px, white, 1 px bottom border: page title left (20 px semibold), then optional search input (280 px, magnifier icon), notification bell with a red count dot, theme toggle, and avatar.
- Content area scrolls independently, background `hsl(205 40% 98%)`.

**Mobile (< 768 px):**
- Sidebar hidden. A 56 px sticky header with a hamburger, the page title, and the bell.
- Hamburger opens a left sheet drawer, 280 px, same sky-blue styling.
- Student portal only: fixed bottom bar, 64 px, white with a top border, 5 evenly spaced items (icon 20 px above an 11 px label). Active = sky; inactive = muted.
- Student portal only: a floating circular AI chat button, 56 px, sky, bottom-right, 80 px above the bottom bar.

## 14.4 Dashboard screens

Common composition, top to bottom:
1. **Greeting row** — "Good morning, <name>" 24 px semibold, with the current term and session as a muted subtitle on the right.
2. **KPI row** — 4 stat cards on desktop (`grid-cols-4`), 2 up on tablet, 1 up on mobile. Each card: white, radius 12 px, 20 px padding; a 40 px rounded-square tinted icon chip top-left; a 12 px uppercase muted label; a 28 px bold value; an optional 12 px delta line in green or red.
3. **Two-column body** (`lg:grid-cols-3`): main column spans 2 (recent results table / today's timetable / recent activity), side column spans 1 (announcements list, quick actions, and — on the staff dashboard — the clock-in card).
4. **School info panel** at the bottom: three columns showing the motto, the grading key as coloured chips, and the three-term calendar.

**Staff clock-in card:** white card, title "Attendance" with a clock icon. Body shows two rows, "Clocked in — 07:32" and "Clocked out — —", in monospace. A status badge reads "On time" (green) or "Late" (amber). One full-width primary button that switches between **Clock In** and **Clock Out**, with a small pin icon and the caption "Location verified on campus". Busy state shows an inline spinner.

## 14.5 Data-table screens (Students, Staff, Library, Inventory, etc.)

1. Header row: page title left; primary "+ Add" button right.
2. Filter bar: a search input (full width on mobile, 320 px on desktop) plus 1–2 select dropdowns (class, status). Filters wrap to a second line on mobile.
3. Table card:
   - Columns for the students table: Photo (32 px circle avatar with initials fallback), Name (bold) with the admission number as a 12 px muted second line, Class, Gender, Guardian, Phone, Status badge, and a right-aligned actions cell (pencil and eye icon buttons).
   - Under 768 px the table becomes a stacked list of cards: avatar and name on the first line, admission number and class on the second, status badge right-aligned, and a chevron.
4. Loading: 5 skeleton rows.
5. Empty: centred icon in a muted circle, a bold line ("No students yet"), a muted explanatory line, and a primary action.

## 14.6 Gradebook (`/staff/gradebook`)

Three cascading selects across the top — Class, Subject, Term. Below them a sticky-header grid:

| Pupil (sticky left column, 200 px) | CA /40 | Exam /60 | Total | Grade | Remark |
|---|---|---|---|---|---|

CA and Exam are compact numeric inputs (72 px wide, centred text). Total, Grade and Remark are read-only, computed live and dimmed to indicate they are derived. Grade renders as a coloured letter chip (A/B green, C/D blue, E amber, F red). A sticky footer bar shows "24 of 30 entered" with a primary **Save all** button and an "unsaved changes" amber dot. On mobile the grid becomes one card per pupil with the two inputs side by side.

## 14.7 Report card editor (`/staff/report-card`)

An A4-proportioned white sheet (max width 800 px) centred on a grey backdrop, with a floating toolbar above it containing **Add subject**, **Save draft**, **Reset**, and **Print**.

Sheet layout:
1. **Header band** — crest left, school name / motto / address / approval number centred, "TERMLY REPORT SHEET" as the title.
2. **Pupil block** — a two-column key/value grid: Name, Pupil ID, Gender, Age, Class, Year, Term, Next term begins, Times school opened, Times present, Position.
3. **Subject table** — columns Subject | CA (40) | Exam (60) | Total (100) | Remark. Editable numeric cells; total and remark auto-fill. A trash icon at the end of each row; an "+ Add subject" row at the bottom. Defaults to 12 rows.
4. **Affective domain table** — 6 traits, each rated 1–5 via radio dots.
5. **Psychomotor table** — 4 skills, same 1–5 dots.
6. **Rating key legend** — 5 Excellent · 4 Good · 3 Average · 2 Fair · 1 Poor.
7. **Comments** — two textareas: Class Teacher's Comment and Head Teacher's Comment, each with a signature name line beneath.
8. **Footer** — grading key band and the promotion note ("An average of 60 % is required for promotion").

Print CSS hides the toolbar and app chrome and prints the sheet edge to edge.

## 14.8 Take Exam (`/student/exams/:id`)

Distraction-free full screen with no sidebar.
- Sticky top bar (white, bordered): exam title 14 px bold with "Question 3 of 20" beneath; on the right a pill-shaped timer chip, monospace bold, sky-tinted — turning red-tinted and pulsing under 5 minutes.
- Question card: an outline "Q3" badge and a "1 point(s)" caption, then the question text at 18 px semibold, then the options.
- Options: full-width buttons, 2 px border, radius 8 px, 16 px padding, left-aligned. Each begins with a 28 px circular letter chip (A/B/C/D). Unselected = grey border with a hover tint; selected = sky border, sky 5 % fill, medium weight, and a filled sky letter chip.
- Navigator: a wrapping row of 36 px square buttons — current sky-filled, answered green-tinted, unanswered grey.
- Footer: **Previous** outline button left (disabled on Q1); **Next** primary right, replaced by a green **Submit Exam** with a send icon on the final question.
- Under 5 minutes: a red-tinted banner with a warning triangle — "Less than 5 minutes remaining! Your exam will auto-submit when time runs out."

## 14.9 ID card generator (`/admin/id-cards`)

Left rail (or top bar on mobile): Students / Staff tabs, a class select, a search field, and a **Print all** button. Main area: a responsive grid of card previews at portrait ID-1 proportions (approximately 54 × 86 mm, i.e. a 0.63 aspect ratio), each 300 px wide with front and back shown side by side.

**Front:** a sky-blue header band about 30 % of the height carrying the crest on a white circle and the school name in white; a white body with a 96 × 120 px passport photo bordered in sky, the pupil's full name in 15 px bold navy, the admission number in monospace, the class name, and a 64 px QR at the bottom-right.

**Back:** a navy header strip reading "PARENT ACCESS"; the school address and both phone numbers in 10 px; a bordered credential box containing `PARENT ID` (label 9 px uppercase muted) with the value `IMS-P-XXXXXX` in 14 px monospace bold, and `ACCESS CODE` with a 14 px monospace bold value; then the note "Scan the QR on the front to view this pupil's profile"; and a footer "If found, please return to the school address above."

## 14.10 Public student profile (`/s/:token`)

A single centred card, max width 480 px, on the sky gradient. Crest and school name at the top; a 120 px circular photo; the pupil's full name at 22 px bold; admission number and class as muted lines; a green "Verified Pupil" badge (or grey "Inactive"); an attendance block showing "Present 96 of 100 days" with a sky progress bar; then a published-results table (Subject | Term | Total | Grade | Remark) or, when nothing is published, the muted line "No published results yet." Footer carries the school address and phone numbers.

## 14.11 Dialogs (student form, staff form, generic)

Centred modal, max width 560 px, radius 16 px, white, 24 px padding, with a heavy backdrop blur. Title 18 px semibold plus a close X. Body is a two-column field grid on desktop and single column on mobile, organised under 13 px uppercase muted section captions (Pupil details, Contact, Guardian, Placement). The photo uploader is a 96 × 96 px dashed drop square that becomes a preview once a file is chosen. Footer is right-aligned: outline **Cancel** then primary **Save**. Under 768 px the dialog becomes a bottom sheet occupying 90 % of the viewport height.

## 14.12 Community wall

A centred single column, max width 640 px. At the top a composer card: avatar, a "Share something with the school…" textarea that expands on focus, an image icon, and a primary **Post** button. Each post card shows an avatar, author name, a relative timestamp, the body text, an optional 16:9 image, and a footer row of reaction chips and a comment count. Comments render as an indented list of small avatar + text rows with an inline reply input at the bottom.

## 14.13 Empty, loading and error patterns

- **Loading:** either a centred sky spinner (`w-8 h-8`, 4 px border, transparent top) on full-page loads, or grey skeleton blocks matching the final layout on in-card loads.
- **Empty:** a 48 px icon inside a 80 px muted circle, a 16 px semibold headline, a 14 px muted body line, and an optional primary action button — all centred with 48 px of vertical padding.
- **Error:** a red-tinted toast, bottom-right on desktop and top on mobile, with a warning icon, a bold title and a body line, auto-dismissing after 5 seconds.
- **Success:** the same toast in green with a check-circle icon.
- **Crash:** a full-page centred card with a warning icon, "Something went wrong", a muted explanation, and a primary **Try Again** button.

---

# 15. FINAL SUMMARY

## 15.1 Scores

| Dimension | Score | Basis |
|---|---|---|
| **Project Health Score** | **68 / 100** | Broad, coherent feature surface with a solid security-definer RLS foundation, undermined by empty reference data, two missing core computations, and three critical/high security items |
| UI completeness | 88 / 100 | All 76 pages exist, four consistent portal shells, coherent design system, dark mode, responsive |
| Backend completeness | 72 / 100 | 49 tables, 11 functions, 21 triggers, 4 edge functions — but no scoring, no promotion, no payments, no email |
| Database completeness | 80 / 100 | Schema is comprehensive and well-shaped; missing uniqueness/bounds constraints and hot-path indexes; 42/49 tables empty |
| Authentication completeness | 78 / 100 | Solid role model and parent-ID mechanism; leaked-password protection off, self sign-up still exposed, permission flags unenforced |
| Feature completeness | 70 / 100 | 26 features complete, 14 mostly complete, 5 needing work, 6 missing |
| Production readiness | 55 / 100 | Blocked by the anonymous certificate read, missing CBT scoring, unscoped teacher access, and unseeded reference data |

## 15.2 Technical debt register

1. Two competing grade-scale definitions (TypeScript vs SQL).
2. Three unused legacy layout files pointing at four phantom routes.
3. One unreferenced page (`Index.tsx`).
4. Two toast libraries in parallel use.
5. React Query mounted but entirely unused.
6. No route-level code splitting across 76 statically imported pages.
7. No pagination anywhere.
8. Mock data presented as real in two analytics dashboards.
9. Report card editor completely disconnected from the database.
10. Signed URLs persisted into `photo_url` with a hard 1-year expiry.
11. `admin_permissions` UI with no enforcement.
12. `activity_logs` table and policies with no writer.
13. AI prompts branded for a different school and phase.

## 15.3 Critical bugs

| # | Bug | Impact |
|---|---|---|
| C1 | `certificates` anonymous SELECT `USING (true)` | Full certificate table is publicly enumerable |
| C2 | Leaked-password protection disabled | Credential-stuffing exposure |
| C3 | CBT exams never scored | The entire CBT feature produces no usable result |
| C4 | Every teacher can read every pupil, grade and answer key | Data-isolation failure inside the school |
| C5 | Self sign-up still reachable on `/login` | Anyone can mint a `student` account |
| C6 | No unique constraint on admission number or `(student_id, date)` attendance | Silent duplicate records corrupting rolls and attendance percentages |

## 15.4 Recommended priority order

**Phase 1 — Security and correctness (must ship first)**
1. Replace the anonymous certificate policy with a `verify_certificate(serial)` definer function.
2. Enable leaked-password protection in the Supabase dashboard.
3. Remove the sign-up toggle from `/login`.
4. Add `teaches_class()` scoping to teacher-facing RLS policies.
5. Add UNIQUE constraints on `students.student_id`, `certificates.serial_number`, and `attendance(student_id, date)`, plus score-bound validation triggers on `grades`.

**Phase 2 — Close the functional gaps**
6. Implement `grade_exam_submission()` and call it on CBT submit; surface scores to pupils and the gradebook.
7. Seed `terms`, `subjects`, `programmes`, and the 15 known `teachers`.
8. Connect `ReportCardEditor` to `grades` / `term_results` so drafts prefill and persist server-side.
9. Build the class promotion routine using `PROMOTION_AVERAGE = 60`.
10. Store pupil photo **paths** and mint signed URLs on read.

**Phase 3 — Honesty and hygiene**
11. Remove or label the mock analytics trends; add enrolment snapshots.
12. Rewrite the AI prompts for a nursery/primary audience and Imagemakers branding.
13. Delete `Index.tsx`, `DashboardLayout`, `Sidebar`, `Header`; standardise on sonner.
14. Enforce or remove `admin_permissions`; start writing `activity_logs`.

**Phase 4 — Scale and polish**
15. Route-level code splitting per portal.
16. Migrate list pages to React Query with pagination.
17. Add the hot-path indexes.
18. Accessibility pass (radiogroup exams, aria-labels, contrast, focus order).
19. Provision storage buckets for payment proofs, resources and assignment submissions.
20. Add a payment provider and a transactional email provider if online collection and receipts are wanted.

## 15.5 Estimated effort to production

Assuming one experienced full-stack engineer working with this stack:

| Phase | Effort |
|---|---|
| Phase 1 — Security & correctness | 3–5 days |
| Phase 2 — Functional gaps | 8–12 days |
| Phase 3 — Honesty & hygiene | 3–4 days |
| Phase 4 — Scale & polish | 8–12 days |
| QA, UAT with real teachers, and a term of parallel paper running | 10–15 days |
| **Total to confident production use** | **≈ 32–48 working days (7–10 weeks)** |

A narrower "safe launch" covering only Phases 1 and 2 plus QA — enough to run one term for real — is approximately **3–4 weeks**.

---

*End of specification.*
