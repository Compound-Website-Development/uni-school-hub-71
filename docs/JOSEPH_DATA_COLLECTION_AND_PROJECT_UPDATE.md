# Imagemakers Nursery and Primary School — Project Update & Data Collection Request
## 22 September 2026

> **Live verification:** The sample pupil `Peter Parker` was removed from the live student register before this handoff. The live register now contains **131 pupil records**, 13 classes, 18 teacher records, 3 academic terms and 21 subjects.

This file is the handoff note for the next school-data collection stage. It is intentionally factual: it separates what is already in the live system from information the school still needs to provide.

## Current project position

The existing Imagemakers School Management System is connected to the live Supabase project and the GitHub repository.

The live database currently contains:
- 131 pupil records
- 13 classes
- 18 teacher records
- 3 academic terms
- 21 subjects

The core portals and existing modules are present:
- Admin portal
- Staff/Teacher portal
- Student portal
- Parent portal
- Student ID/QR flow
- Attendance
- Gradebook and report-card system
- Finance/invoice/receipt infrastructure
- CBT/examination infrastructure
- Assignments and lesson plans
- Communications
- Documents/policy management
- Transport administration

The project is now at the stage where the remaining work depends heavily on using the school's actual operational records rather than demo/sample records.

## Important live-data note

The database currently has no live rows in several operational tables, including:
- invoices
- invoice lines
- receipts
- discounts/scholarships
- attendance
- exams/questions/submissions
- staff attendance
- policy documents
- activity logs

Only a small number of grade/result rows currently exist.

This means the system must NOT invent marks, attendance, invoices, payments, receipts, exam results, comments or historical trends just to make the dashboards look populated.

## Information required from Mr Joseph / school

### 1. Student records

Please provide the current student register for the 2026/2027 session, preferably as Excel/CSV.

For every pupil, confirm:
- Admission number
- Full name exactly as the school records it
- Date of birth
- Gender
- Current class
- Current class arm
- Admission date where available
- Parent/guardian full name
- Parent/guardian phone number
- Parent/guardian email where available
- Parent/guardian relationship
- Home address where required
- Student photo/passport photograph
- Any other field the school currently keeps in its official register

### 2. Class confirmation

Confirm the current class/arm assignment for every pupil.

The system currently has 13 class records. The school should confirm that these are still correct for the current resumed session and identify any pupil who has moved class/arm.

### 3. Parent information

For each pupil, confirm the correct parent/guardian information.

Where a parent has more than one child in the school, confirm that the children belong to the same parent account so sibling access can be linked correctly.

### 4. Student photographs / ID cards

The current ID-card system supports pupil photographs, but the school still needs to supply the correct photographs for the pupils whose cards should be issued.

Please provide:
- One clear passport-style photo per pupil
- The photo matched to the pupil's admission number or full name
- Any existing school-approved ID-card layout/reference if the school wants the physical card to follow it

The ID card should use the real pupil photo and real class/admission information.

### 5. Teachers

Confirm the final 2026/2027 teacher-to-class assignment.

Imagemakers uses a primary-school class-teacher model:
- One class teacher is responsible for the assigned class.
- The class teacher can handle the normal subjects for that class.
- Specialist subjects are separate only where the school actually has specialist teachers.
- Do not create invented subject-teacher assignments.

Specialist subjects already identified from the school information include:
- Diction
- French
- Art & Creative
- Yoruba
- Coding
- Abacus

Swimming instructor is not school staff unless the school explicitly changes that instruction.

### 6. Academic setup

Please provide/confirm:
- Exact term start and end dates
- Current timetable/schedule
- Subjects taught in each class
- Any specialist-subject allocation
- Current assessment dates
- Any approved CA/exam rules if different from the existing 40/60 configuration
- Any official report-card remarks or grading changes

Do not send invented or estimated dates. The system should use the school's confirmed dates.

### 7. Attendance

Because the school has resumed, attendance can now start being recorded from the real school register.

Confirm:
- First official attendance date for the 2026/2027 session
- Whether attendance is recorded daily
- Any approved late/absence rules
- Who is responsible for taking each class register

### 8. Fees and finance

Confirm the current fee structure for the active term/session.

The existing class-based fee configuration should be verified against the school's current approved figures.

For actual finance operation, the school should provide:
- Approved fee items
- Due dates
- Approved discounts/scholarships
- Rules for approving discounts
- Payment methods accepted by the school
- Approved receipt format/reference requirements

Online card payment should use a school-owned merchant/payment account. Payment credentials/API secrets must never be sent through WhatsApp or committed to GitHub.

### 9. CBT

For the CBT system, the school needs to provide actual examination content before real exams can run:
- Exam name
- Subject
- Class
- Duration
- Instructions
- Questions
- Answer options
- Correct answers
- Marks per question
- Exam availability window
- Any pass/grade rules

No questions or correct answers should be invented and presented as school exams.

### 10. Documents

For the Admin All Documents area, provide the actual school documents that should be stored/indexed, for example:
- Approved policies
- Report-card templates where applicable
- Receipt format
- Certificates
- School forms
- Other official administrative documents

Generated ID cards and report cards are record-backed outputs, not ordinary uploaded files. They should be accessible from their relevant records rather than creating fake placeholder files.

### 11. Transport / driver tracking

The current project has transport administration infrastructure, but continuous driver GPS tracking is not yet a completed feature.

To implement it properly, the school must confirm:
- Driver identity
- Vehicle details
- Routes
- Pickup/drop-off points
- Which pupils use each route
- Which parents are allowed to view a route
- Driver consent and school policy for location sharing
- When tracking should be active
- Who can stop/start a trip

Only authorised parents of pupils assigned to the relevant route should be able to see the driver's live location.

## WhatsApp message to Mr Joseph

Good afternoon Sir.

I wanted to give you an update on the school management system now that the school has resumed.

The main system is already built and connected to the school's Supabase backend and GitHub project. The Admin, Staff, Student and Parent portals are in place, including the student records, class/teacher structure, attendance, results/report cards, finance, CBT, communications, documents and other school-management sections. The current finishing stage is focused on connecting and validating these workflows with the school's real 2026/2027 operational data.

We are now at the stage where the remaining setup needs the school's current operational information so I can finish the system using the actual 2026/2027 records rather than sample data.

Since the school has resumed and we are now in the second week, please can we begin collecting the current student information, especially:

- Updated student register with accurate classes
- Parent/guardian names and contact details
- Student passport photographs for the ID cards
- Confirmation of current class teachers
- Subjects and specialist-subject arrangements
- Current term dates and timetable
- Approved fee/discount information
- Any official receipt, report or policy documents that should be used in the system
- CBT materials when the school is ready to use the CBT section

The ID cards in particular will need the correct pupil photographs and confirmed class information before they can be finalised properly.

I have also updated the project documentation so that the information we still need from the school is clearly recorded.

Once the current school records are provided, I can finish the remaining live-data setup and testing around them instead of using placeholders.

Thank you, Sir.

## Next implementation sequence

1. Verify all current pupil/class/parent records.
2. Collect and attach pupil photographs.
3. Confirm teacher/class assignments.
4. Confirm current term dates and subjects.
5. Begin real attendance entry.
6. Configure the approved current fees and generate real invoices.
7. Configure verified manual payments/receipts.
8. Connect the school-owned online payment account when its provider credentials/configuration are supplied securely.
9. Enter real academic scores through the staff gradebook.
10. Generate and verify the canonical report cards.
11. Load real CBT content.
12. Finish transport/driver tracking only after route, driver, consent and parent-access information is confirmed.
13. Run end-to-end Admin → Staff → Student → Parent regression tests before final demonstration.

## Handoff rule

A feature is not considered complete merely because its page renders.

For final demo readiness, each important workflow must be tested with real school records and the correct role permissions, and empty data must be shown honestly rather than replaced with fake production values.
