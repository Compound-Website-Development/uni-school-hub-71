

## Comprehensive Feature Expansion Plan — Nigerian Private Schools Platform

After analyzing competitor school management systems and researching industry-standard features, here is a plan to elevate the NPS platform significantly beyond what exists today.

---

### Current State Summary

**Existing modules (30 pages across 3 portals):**
- Admin: Dashboard, Analytics, Activity Logs, Students, Staff, Approvals, Fees, Announcements, Bulk Upload, Users, Settings, Reports
- Staff: Dashboard, Students, Classes, Attendance, Gradebook, CBT, Reports, Admissions, Profile
- Student: Dashboard, Grades, Attendance, Reports, Fees, Announcements, Exams, Schedule, Settings, Transcript

---

### New Modules to Add (grouped by priority)

#### Batch 1 — High Impact Core Modules

**1. Homework/Assignment System**
- Staff: Create assignments with due dates, attach instructions, assign to class/subject
- Student: View assignments, submit work (text response), see grades/feedback
- Tables: `assignments` (title, description, class_id, subject_id, due_date, created_by), `assignment_submissions` (student_id, assignment_id, content, grade, feedback, submitted_at)
- Pages: `StaffAssignments.tsx`, `StudentHomework.tsx`

**2. Parent Portal**
- Separate role (`parent`) with its own layout and dashboard
- View linked child's grades, attendance, fees, announcements
- Tables: `parent_student_links` (parent_user_id, student_id)
- Pages: `ParentDashboard.tsx`, `ParentGrades.tsx`, `ParentAttendance.tsx`, `ParentFees.tsx`
- Login page updated to support parent role selection
- New `ParentLayout.tsx`

**3. Lesson Plans**
- Staff creates daily/weekly lesson plans per subject/class
- Admin can review all plans
- Table: `lesson_plans` (teacher_id, class_id, subject_id, date, topic, objectives, activities, resources, homework_assigned)
- Pages: `StaffLessonPlans.tsx`

**4. Event Calendar**
- School-wide event calendar visible to all roles
- Admin/staff can create events (exams, holidays, meetings, sports)
- Table: `school_events` (title, description, event_date, event_type, created_by)
- Pages: `StudentCalendar.tsx` (also accessible from staff/admin)

**5. AI-Powered Features**
- AI Chatbot on student dashboard for homework help (using Lovable AI gateway)
- AI report card comment generator for staff
- AI analytics insights on admin dashboard
- Edge function: `supabase/functions/ai-assistant/index.ts`
- Components: `AIChatWidget.tsx`, AI comment button in gradebook

#### Batch 2 — Communication & Community

**6. Messaging / Internal Communication**
- Direct messages between staff, parents, and admin
- Group messages per class
- Table: `messages` (sender_id, receiver_id, subject, body, is_read, created_at)
- Pages: `StaffMessages.tsx`, `ParentMessages.tsx`
- Enable realtime on messages table

**7. Discussion Forum / Parent Groups**
- Class-based discussion groups where parents and teachers interact
- Table: `forum_posts` (class_id, author_id, title, body, created_at), `forum_replies` (post_id, author_id, body)
- Pages: `ParentForum.tsx`, `StaffForum.tsx`

**8. SMS/Email Notifications**
- Admin can send bulk SMS/email to parents, students, or staff
- Edge function for email via SMTP
- UI in admin announcements page with delivery channel selector

#### Batch 3 — Administrative Tools

**9. Library Management**
- Book catalog with search
- Issue/return tracking per student
- Tables: `library_books` (title, author, isbn, quantity, available), `book_issues` (book_id, student_id, issue_date, return_date, status)
- Pages: `AdminLibrary.tsx`, `StudentLibrary.tsx`

**10. Transport Management**
- Route management, vehicle tracking, student-route assignment
- Table: `transport_routes` (name, pickup_points, driver_name, vehicle_number), `student_transport` (student_id, route_id)
- Pages: `AdminTransport.tsx`

**11. Leave Management (Staff)**
- Staff submit leave requests, admin approves/rejects
- Table: `leave_requests` (teacher_id, start_date, end_date, reason, status, reviewed_by)
- Pages: `StaffLeave.tsx`, admin section in staff page

**12. Visitor Management**
- Log visitors with purpose, time in/out, person visiting
- Table: `visitor_log` (name, phone, purpose, person_to_meet, check_in, check_out)
- Pages: `AdminVisitors.tsx`

**13. ID Card Generator**
- Generate student/staff ID cards as downloadable PDF with photo placeholder, QR code, school branding
- Pages: `AdminIDCards.tsx` (uses jsPDF)

**14. Certificate Generator**
- Transfer certificate, character certificate templates
- Table: `certificates` (student_id, type, issued_date, serial_number)
- Pages: `AdminCertificates.tsx`

**15. Complaint/Grievance System**
- Students/parents submit complaints, admin tracks and resolves
- Table: `complaints` (user_id, subject, description, status, priority, resolved_at)
- Pages: `StudentComplaints.tsx`, `AdminComplaints.tsx`

**16. Student Health Records**
- Medical history, allergies, emergency contacts
- Table: `health_records` (student_id, blood_group, allergies, medical_conditions, emergency_contact)
- Pages: within student profile view

---

### Database Migrations Required

**New tables (16 tables):**
- `assignments`, `assignment_submissions`
- `parent_student_links`
- `lesson_plans`
- `school_events`
- `messages` (with realtime)
- `forum_posts`, `forum_replies`
- `library_books`, `book_issues`
- `transport_routes`, `student_transport`
- `leave_requests`
- `visitor_log`
- `complaints`
- `health_records`
- `certificates`

All with appropriate RLS policies using existing `has_role()`, `is_staff()`, `get_student_id()` functions. A new `parent` value will be added to the `user_role` enum.

### New Pages to Create (~25 pages)

```text
src/pages/
├── parent/
│   ├── ParentDashboard.tsx
│   ├── ParentGrades.tsx
│   ├── ParentAttendance.tsx
│   ├── ParentFees.tsx
│   ├── ParentMessages.tsx
│   └── ParentForum.tsx
├── staff/
│   ├── StaffAssignments.tsx
│   ├── StaffLessonPlans.tsx
│   ├── StaffMessages.tsx
│   ├── StaffForum.tsx
│   └── StaffLeave.tsx
├── student/
│   ├── StudentHomework.tsx
│   ├── StudentLibrary.tsx
│   ├── StudentCalendar.tsx
│   └── StudentComplaints.tsx
├── admin/
│   ├── AdminLibrary.tsx
│   ├── AdminTransport.tsx
│   ├── AdminVisitors.tsx
│   ├── AdminIDCards.tsx
│   ├── AdminCertificates.tsx
│   └── AdminComplaints.tsx
src/components/
├── layout/ParentLayout.tsx
├── AIChatWidget.tsx
```

### Files to Edit

- `src/App.tsx` — Add ~25 new routes
- `src/components/layout/AdminLayout.tsx` — Add new sidebar sections (Library, Transport, Visitors, ID Cards, Certificates, Complaints)
- `src/components/layout/StaffLayout.tsx` — Add Assignments, Lesson Plans, Messages, Leave, Forum
- `src/components/layout/StudentLayout.tsx` — Add Homework, Library, Calendar, Complaints
- `src/pages/Login.tsx` — Add parent role option
- `src/hooks/useAuth.tsx` — Support parent role + parent data fetching
- `src/components/ProtectedRoute.tsx` — Add parent role support

### AI Integration

- Edge function `ai-assistant` using Lovable AI gateway (LOVABLE_API_KEY already configured)
- Student AI chatbot for homework help
- Staff AI comment generator for report cards
- Admin AI insights summarizer

### Implementation Order

Due to scope, this will be implemented across multiple messages:
1. **Database migrations** for all new tables + parent role enum update
2. **Parent Portal** (layout + 6 pages + auth changes)
3. **Homework/Assignments** (staff + student pages)
4. **Lesson Plans + Event Calendar**
5. **AI Features** (chatbot widget + edge function)
6. **Library + Transport + Visitor Management**
7. **Leave, Complaints, ID Cards, Certificates, Health Records**
8. **Messaging + Forum** (with realtime)
9. **Sidebar updates** for all layouts with new nav items

