# IMAGEMAKERS SMS — FRESH CHAT IMPORT / ENGINEERING CONTEXT

Prepared: 24 September 2026
Repository: Compound-Website-Development/uni-school-hub-71
Supabase project: weqzvfpzuybyuvruumae
School: Imagemakers Nursery and Primary School
Session: 2026/2027

## START HERE — IMPORT PROMPT

Read this file first, then inspect the live GitHub repository and live Supabase project before making changes.

You are continuing an existing engineering project, not starting a new one.

Your job is to pick up from where the previous chat left off. Do not ask me to re-explain the project unless the live repository/database genuinely lacks the information. Prefer inspecting the actual code and Supabase schema/data over trusting old chat summaries.

Rules:
- Use GitHub for actual code changes.
- Use Supabase for actual database/schema/data changes.
- Do not invent school data, pupil admission numbers, parent details, photos, dates, marks, attendance, timetable entries, events, fee transactions or specialist allocations.
- Treat the latest explicit school-supplied information as the current source of truth.
- Preserve existing functionality while redesigning UI.
- The school colour is SKY BLUE / BLUE. Do not use green as the main portal colour.
- Admin uses the existing admin navy/blue visual language.
- Student portal uses sky-blue / cyan / navy with gradients, tints, liquid-glass surfaces and subtle motion.
- Student portal desired navigation: desktop sidebar + mobile liquid-glass bottom nav. Do not add a second unnecessary desktop top navigation.
- Do not reuse one icon for multiple unrelated functions.
- Do not replace real features with static mock UI.
- Empty database records must render honest empty states.
- Never claim production deployment unless a public URL has actually been verified.
- Before modifying a file, fetch the current version. Verify important changes after writing them.
- When a feature needs school information that is not supplied, record it in the missing-data list instead of guessing.

First inspect:
1. This file.
2. docs/IMAGEMAKERS_SMS_PROJECT_HANDOFF.md
3. docs/FUNCTIONAL_SPEC.md
4. Current main branch files for the relevant portal.
5. Live Supabase schema and counts.

Then continue from the actual live state.

---

# 1. PROJECT PURPOSE

This is a full nursery/primary school management system for Imagemakers Nursery and Primary School in Lagos.

Portals:
- Admin
- Staff / Teacher
- Student
- Parent

Major modules:
- Student records
- Classes / arms
- Teacher assignments
- Attendance
- Staff clock-in
- Results / gradebook
- Termly report cards
- CBT examinations
- Homework / assignments
- Lesson plans
- Learning resources
- Library
- School calendar / events
- Announcements
- Community Wall
- Parent access / sibling linking
- Fees / invoices / receipts
- ID cards / QR student verification
- Certificates / official documents
- Complaints / communication
- Analytics / activity
- Optional transport foundation (now deprioritised because the school outsourced transport)

Tech stack:
- React + Vite + TypeScript
- Tailwind CSS
- shadcn/Radix UI
- Lucide React
- React Router
- Supabase/Postgres/Auth/Edge Functions
- Recharts
- jsPDF / AutoTable
- QRCode
- React Markdown

---

# 2. VERIFIED LIVE DATABASE STATE — 24 SEPTEMBER 2026

Current live counts:
- students: 219
- classes: 13
- student_feature_settings: 219
- parent_student_links: 0
- grades: 0
- attendance: 0
- exams: 0
- exam_questions: 0
- exam_submissions: 0
- assignments: 0
- invoices: 0
- invoice_lines: 0
- receipts: 0
- fee_items: 0
- class_subjects: 0
- schedules: 0
- school_events: 0

Important:
The current 219 pupil records are the latest school-supplied class-by-class list. They are actual school names/classes, but the official admission numbers and most other personal/administrative fields are still missing.

Student feature settings:
- 219 rows
- AI tutor enabled by default
- calculator enabled by default
- this is configuration, not fake academic data

Temporary student IDs:
- Current records use system placeholders like PENDING-2026-001 etc.
- These are NOT official admission numbers.
- Replace with school-issued admission numbers when supplied.
- Never label the temporary values as admission numbers.

Parent links:
- 0
- Expected until parent/guardian identity and sibling relationships are supplied.

Do not fill empty operational tables with fake records.

---

# 3. CURRENT CLASS STRUCTURE — LATEST SCHOOL LIST

1. KG 1 — Faith — 18
2. KG 2 — Joy — 15
3. Nursery 1 — Grace — 14
4. Nursery 1 — Peace — 15
5. Nursery 2 — Gift — 22
6. Grade 1 — Emerald — 15
7. Grade 1 — Gold — 15
8. Grade 2 — Topaz — 27
9. Grade 3 — Ruby — 22
10. Grade 4 — Opal — 13
11. Grade 4 — Sapphire — 13
12. Grade 5 — Zircon — 13
13. Grade 6 — Diamond — 17

Total: 219.

Changes versus older project data:
- Grade 1 Gold is now present.
- Grade 3 Ruby is now present.
- Older arms such as KG2 Hope and Nursery1 Pearl were not in the latest pupil list.
- Earlier staff/project data also contained Grade1 Peace; do not assume it is current.
- Earlier photo labelling included “Nur2 love”; latest official list says Nursery 2 — Gift. Treat the official class list as current and flag the naming discrepancy if it matters.

The latest KG2 final entry was supplied as:
- “S---Aribisala”
Preserve it exactly until the school supplies the full official name. Do not attempt to infer or reconstruct it.

---

# 4. WHAT HAS BEEN LOADED INTO SUPABASE

Loaded:
- 219 pupils
- 13 classes
- latest class placement
- default AI/calculator feature settings

Also present from the project:
- 18 teacher records
- 21 subject records
- 3 term records
- parent access fields on students
- QR/public student profile infrastructure
- canonical report-card infrastructure
- attendance, finance, CBT, assignment, lesson-plan and communication schemas

Not yet loaded with current school data:
- parent links
- admission numbers
- DOB/gender/admission dates
- official pupil photos
- complete specialist allocations
- current timetables
- live attendance
- live results
- live invoices/receipts/payments
- school events
- homework records
- lesson plans
- CBT question bank

---

# 5. SCHOOL DATA STILL NEEDED

## Per pupil

Needed for every current pupil:
- official admission number
- full official name confirmation where needed
- date of birth
- gender
- admission date where available
- parent/guardian full name
- parent/guardian phone
- parent/guardian email where available
- parent/guardian relationship
- home address where required
- official passport photograph
- any other field in the school's official register

Parent/sibling linking:
- identify the correct parent/guardian account for each child
- confirm when a parent has more than one child
- confirm which children belong under the same parent account

Photo handling:
- one clear passport-style image per pupil
- Android/iOS capture is acceptable
- match photo to admission number or exact full name
- use the stored path/object strategy; do not persist expiring signed URLs as permanent data

## Classes / teachers / subjects

Still needed:
- arm-specific class-teacher assignments for all 13 current arms
- exact subjects taught in every current class
- specialist subject allocations
- specialist teacher allocations
- clarify classes with more than one class teacher and how the database should represent them

Already established design rule:
Class teachers teach the normal subjects for their own class.
The intended model is:
Teacher -> Assigned Class -> Students -> Subjects -> Attendance / Results / Assignments / Report Card

Not:
Teacher -> Assigned Subject -> Whole Class

Specialist areas already discussed:
- Diction
- French
- Art & Creative
- Yoruba
- Coding
- Abacus

Swimming:
- handled by an outsourced hotel instructor, not normal school staff

## Academic calendar / timetable

Still needed:
- exact 2026/2027 term start and end dates
- current weekly timetable for every current class arm
- current assessment dates
- any official changes to CA/exam weighting
- official grading/remark wording if changed
- first official attendance date for the session
- official late/absence rules
- confirmation that class teachers take the class register

## Finance

Still needed:
- approved fee structure by class/arm if it differs from project notes
- due dates
- approved discount/scholarship rules
- actual invoice samples
- actual receipt/payment samples
- payment method(s)
- school-approved receipt format
- bank/payment details if online payment is required
- school-owned payment-provider account/configuration

Do not send or commit payment secrets, passwords or private keys.

## Documents / communications

Still needed where the school wants them digitally reproduced:
- report-card sample
- admission form
- certificate templates
- transfer/withdrawal forms
- leave forms
- school policies
- official letters/templates
- other school documents

## School life content

Still needed:
- events for the student/parent calendar
- announcement content
- current academic notices
- any school activity dates

The student dashboard already queries the school_events table. It currently has 0 rows, so the “What’s coming up” area must stay an honest empty state until the school supplies events.

## CBT

Still needed:
- real exam titles
- classes
- subjects
- question bank
- answer options
- correct answers
- exam timing
- publish/start/end rules

The CBT authoring UI exists, but real question content has not been supplied.

---

# 6. STAFF CLOCK-IN DATA DEPENDENCY

The staff clock-in component uses geolocation and a school geofence.

It requires:
- exact school latitude
- exact school longitude
- approved geofence radius
- approved clock-in cutoff

The implementation currently reads these from school configuration and refuses clock-in outside the configured campus radius.

Do not invent coordinates.

---

# 7. QR ATTENDANCE / ID CARD DATA DEPENDENCIES

ID cards depend on:
- official admission number
- official pupil name
- class/arm
- official pupil photo
- school branding
- public student verification token
- parent ID/access credentials for parent access

QR attendance/verification is only meaningful once official student identities are loaded.

The ID-card generator has been designed as a double-sided print-ready PDF:
- front: school branding, pupil identity, photo, QR
- back: parent access information / QR instructions

Do not print temporary PENDING IDs as final admission numbers.

---

# 8. STUDENT PORTAL — CURRENT DESIGN DIRECTION

User's explicit visual preference:
- school blue / sky blue
- gradients and tints are welcome
- liquid-glass effects are welcome
- subtle animation is welcome
- no green as the main brand colour
- no generic stock-photo hero
- no ugly custom SVG illustrations
- use strong editorial layouts, CSS/illustration treatment or suitable illustration assets
- no repeated icon for unrelated actions

Desired navigation:
Desktop:
- fixed left sidebar
- sky-blue gradient / layered blue surface
- distinct Lucide icons
- grouped navigation
- no unnecessary second desktop top nav

Mobile:
- compact header only for navigation/context
- fixed liquid-glass bottom navigation
- 5 primary destinations
- full module list available from a drawer
- AI button should sit above the bottom bar

Student dashboard:
- must not look like a generic school template
- remove generic hero image
- use a custom editorial composition with CSS illustration / abstract study visual
- use sky blue / cyan / navy with restrained gold as secondary accent
- distribute information across cards/sections instead of one dump
- show real data or honest empty states
- footer should feel intentional and attractive
- AI Tutor card must open the actual tutor
- Calculator card must open the actual calculator

AI tutor:
- must help students learn
- for homework/problem solving: guide method, hints, questions and similar examples instead of simply handing over the final answer
- for straightforward factual/general-knowledge questions: give a clear factual answer
- current widget now listens for the custom event “imagemakers-open-ai”

Calculator:
- should open as an on-page study tool
- must respond to the dashboard button
- respects student_feature_settings
- no need for a separate external page

---

# 9. STAFF PORTAL — DESIGN DIRECTION

Staff dashboard should feel blue enough to match the school while still reading like an adult operator workspace.

Important:
- the dashboard should distribute information
- avoid dumping every block below the fold
- keep the useful class/attendance/gradebook/CBT workflow prominent
- retain the staff clock-in card
- staff sidebar icons should be distinct and not reused
- current staff dashboard has received a blue styling pass, but the remaining staff pages still need their own page-level redesign rather than only a sidebar change

Staff pages to review/redesign:
- Dashboard
- Students
- Attendance
- Gradebook
- Classes / My Class
- Report Card
- Reports
- CBT Studio
- Assignments / Homework
- Lesson Plans
- Messages
- Forum
- Leave
- Profile
- Admin-only staff tools where relevant

When redesigning these:
- preserve queries and permissions
- preserve class-teacher scope
- keep normal-subject access for assigned class
- keep specialist subject restrictions
- use page-specific visual hierarchy rather than one repeated card grid

---

# 10. PARENT PORTAL — IMPORTANT NOTES

Parent dashboard now opens for admin preview as well as parent users.

The admin preview path should not attempt to treat an admin as a normal linked parent.

Parent dashboard still needs a better information hierarchy:
- do not leave one giant “information dump” at the bottom
- place child summary, grades, attendance, fees, announcements, homework and school-life information in separate meaningful regions
- do not display fake child records
- school-bus UI is not a current operational requirement because transport is outsourced

Known earlier issue:
- Parent runtime error “PortalIllustration is not defined” was reported. Current source was changed away from that reference, but real browser/build verification is still required before treating the issue as closed.

---

# 11. IMPORTANT BACKEND / CORRECTNESS DECISIONS

Already implemented:
- revoked anonymous execution of internal helper RPCs
- unique attendance student/date index
- CA range validation for new grades: 0–40
- Exam range validation for new grades: 0–60
- class-teacher scope corrections
- parent-to-admin message routing function
- student AI/calculator settings
- JWT verification on AI edge function
- transport foundation
- QR/public student profile infrastructure
- canonical report-card route/data handling work

Known limitations / follow-up:
- Supabase security advisors may still contain findings
- leaked-password protection still needs dashboard configuration
- CBT auto-scoring still needs implementation
- report-card editor/database persistence still needs validation
- teacher-scoped RLS requires continued testing
- certificate anonymous access needs fixing if still present
- no fake analytics should be presented as real
- no official timetable/events/attendance/finance records should be fabricated

---

# 12. TRANSPORT STATUS

The school confirmed on 23 September 2026:
- bus operations are outsourced
- no need for the school transport tracking feature right now

Engineering consequence:
- driver portal and active-trip work are deprioritised
- do not spend current effort polishing the driver portal
- preserve the foundation unless the school later asks to use it

---

# 13. GITHUB / DEPLOYMENT NOTES

Repository is public.

Important privacy rule for future documentation:
- do not put new copies of pupil names, guardian contacts, photos or other personal school data into public source files
- keep sensitive school records in Supabase
- use project docs for architecture, workflows, schemas, counts and requirements
- treat any existing public document containing personal data as something to minimise rather than duplicate

The repository previously had a functional-spec sync GitHub workflow that was removed because it was part of a deployment troubleshooting pass.

Vercel:
- connected Vercel projects have been seen against this repository
- at least one cleanup deployment succeeded in the previous investigation
- later checks showed Hobby/build quota issues
- do not claim the app is live unless a real public deployment URL is checked

---

# 14. HOW TO WORK FROM HERE

For any new engineering task:
1. Inspect current GitHub code.
2. Inspect the relevant live Supabase tables.
3. Confirm existing behaviour.
4. Make the smallest correct code/data change that actually solves the request.
5. Verify queries/counts or file contents after the change.
6. Do not use fake school data to make the UI look populated.
7. Record missing school information separately from software bugs.
8. If a design is being redone, redesign the actual page, not just the icon or sidebar.

When I say “redesign”, I mean:
- new layout
- spacing
- hierarchy
- card structure
- colour treatment
- typography
- controls
- illustrations
- motion
- empty/loading/error states
- responsive behaviour
while keeping the underlying feature and meaning.

---

# 15. CURRENT SCHOOL CONTACT / DATA COLLECTION CONTEXT

The school contact has been sending information in batches.

Communication preference:
- reminders should be respectful, neutral and practical
- do not sound emotional, impatient, desperate or accusatory
- do not repeatedly use the contact's first name
- “Hi” or “Good morning/Good afternoon/Good evening” is fine
- avoid excessive flattery
- explain exactly what remains outstanding
- acknowledge what they already sent
- group requests into a short checklist
- do not resend the entire original request every time

Latest useful interaction:
The school sent the complete current class-by-class pupil list on 24 September 2026 and said Grade 1 Gold and Grade 3 Ruby were being added. The school also confirmed transport is outsourced.

---

# 16. DEEP FEATURE DATA AUDIT — ASK THE SCHOOL FOR THESE NEXT

Prioritise information that directly unlocks a feature.

High priority:
- admission numbers for all pupils
- parent/guardian records and sibling links
- pupil photos
- exact current class-teacher assignments
- specialist teacher allocations
- class-by-class timetables
- exact official term dates
- first attendance date and attendance rules
- fee structure + invoice/receipt samples
- school events/calendar dates

Medium priority:
- assessment dates
- report-card sample / official remark changes
- admission/leave/transfer/certificate documents
- announcements / notices
- library catalogue
- lesson-plan expectations
- assignment/homework rules

Feature-specific:
- Staff Clock-In -> school GPS coordinates + geofence rule + cutoff
- QR ID cards -> admission numbers + photos + approved parent access wording
- Parent portal -> parent identity + sibling relationships
- Calendar -> events
- Schedule -> timetables
- Attendance -> official start date + daily rules + class responsibility
- Gradebook/report cards -> subjects + assessment dates + any grading changes
- Fees -> approved fee schedule + due dates + invoice/receipt format
- CBT -> exam/question content and schedule
- Community Wall -> moderation rules / who can post if the school has a policy
- Library -> catalogue/borrow rules
- Announcements -> current school notices
- Certificates/forms -> official templates
- Analytics -> real historical data or explicitly labelled demo/forecast sources

---

# 17. FRESH-CHAT HANDOFF PRINCIPLE

Do not try to reconstruct the whole old conversation from memory.

Use:
- this file for orientation and current requirements
- docs/FUNCTIONAL_SPEC.md for functional behaviour
- docs/IMAGEMAKERS_SMS_PROJECT_HANDOFF.md for deeper history
- live GitHub for the actual implementation
- live Supabase for the actual data/schema

The objective is to continue engineering from the real project state with minimal context rot.
