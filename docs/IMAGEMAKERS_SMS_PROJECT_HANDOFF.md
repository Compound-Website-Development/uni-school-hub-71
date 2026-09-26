# IMAGEMAKERS NURSERY AND PRIMARY SCHOOL — PROJECT HANDOFF / CONTEXT FILE

Document: IMAGEMAKERS_SMS_PROJECT_HANDOFF.md
Prepared: 24 September 2026
Repository: Compound-Website-Development/uni-school-hub-71
Purpose: Carry the useful engineering, product, school-data, UI/UX and handover context into a fresh AI/chat session without carrying the whole conversational history.

IMPORTANT:
- This is an operational handoff, not a raw chat transcript.
- It intentionally removes repeated chatter, emotional reactions, duplicate explanations and unrelated personal context.
- Latest school-supplied data takes priority over older data.
- Live GitHub and live Supabase are the strongest technical sources of truth.
- This file is a navigation document. It must not override the code/database when they disagree.
- Never invent pupil admission numbers, parent details, DOBs, genders, photos, payments, attendance, marks, timetable entries or other school records.
- Never send or commit secrets, passwords, private API keys or payment-provider credentials.
- Use real school data only where the school has supplied/confirmed it.
- The previously partial pupil name has now been supplied by the school as "S-ARIBISALA AYOOLUWATOFUNMI" on 25 September 2026. Preserve that exact supplied spelling; the live student record has been updated accordingly.

======================================================================
1. PROJECT IDENTITY
======================================================================

School:
Imagemakers Nursery and Primary School

Known school identity:
- Motto: "Imparting Wisdom & Morals"
- Academic session: 2026/2027
- Location: Surulere / Ojuelegba, Lagos
- Project type: full nursery/primary school management system with separate Admin, Staff, Student and Parent portals.
- Driver/bus feature was discussed and built as a foundation, but the school has now confirmed that bus operations are outsourced. Do not spend current engineering time on the driver portal or school-owned bus tracking unless the school later requests it.

Project repository:
https://github.com/Compound-Website-Development/uni-school-hub-71

Supabase project:
https://weqzvfpzuybyuvruumae.supabase.co

Main technical stack:
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/Radix UI
- Lucide React
- Supabase/Postgres
- Supabase Auth
- Supabase Edge Functions
- React Router
- Recharts
- jsPDF / jsPDF AutoTable
- QRCode
- React Markdown
- Sonner

Package scripts currently include:
- npm run dev
- npm run build
- npm run build:dev
- npm run lint
- npm run preview

No production deployment should be claimed unless an actual public URL has been verified.

======================================================================
2. SOURCE-OF-TRUTH RULE
======================================================================

Use this order when deciding what is current:

1. The latest explicit school message/document, especially the latest class-by-class pupil register.
2. Live Supabase schema and live row counts.
3. Current GitHub main branch.
4. docs/FUNCTIONAL_SPEC.md and other project docs.
5. Older WhatsApp messages and older project notes.
6. This handoff file for orientation and history.

When a newer school message conflicts with older project data:
- update the live school record to the newest confirmed version;
- do not quietly preserve the old value;
- record the conflict when useful;
- ask the school only for the unresolved part.

======================================================================
3. CURRENT LIVE SUPABASE STATE — VERIFIED 24 SEPTEMBER 2026
======================================================================

Live counts after loading the latest supplied roster:
- students: 219
- classes: 13
- student_feature_settings: 219
- parent_student_links: 0
- grades: 0
- attendance: 0
- exams: 0
- assignments: 0
- invoices: 0
- fee_items: 0
- class_subjects: 0
- schedules: 0

Important explanation:
The roster replacement deliberately removed the previous incomplete/demo pupil data and class-linked operational rows that depended on that old roster. Therefore grades, attendance, exams, assignments, invoices, fee items, schedules and class-subject allocations are currently empty. This is preferable to carrying incorrect/sample records forward.

Do NOT replace these empty operational tables with fake records.

student_feature_settings:
- 219 rows
- AI tutor enabled by default
- Calculator enabled by default
- This is configuration, not fake academic data.

Parent links:
- 0
- This is expected until the school supplies correct parent/guardian identity and sibling relationships.

Admission numbers:
- NOT supplied.
- The 219 current student records use temporary system IDs in the form PENDING-2026-###.
- These are placeholders, NOT official admission numbers.
- Do not present them as admission numbers.
- Replace them with the school's official admission numbers once supplied.

Student profiles:
Only names and classes are currently loaded from the latest list.
The following remain largely unfilled:
- official admission number
- DOB
- gender
- admission date
- parent/guardian full name
- parent/guardian phone
- parent/guardian email
- parent/guardian relationship
- home address
- official student photo
- any additional official register fields

======================================================================
4. CURRENT CLASS STRUCTURE — VERIFIED AGAINST LATEST SCHOOL LIST
======================================================================

There are 13 current classes and 219 pupils.

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

Total = 219.

Older class records that existed before the latest school roster included:
- Kindergarten Two (Hope)
- Nursery One (Pearl)
- Grade One (Peace)

Those are NOT in the latest supplied 2026/2027 pupil list. Treat the latest 13-class structure as current unless the school explicitly adds/reintroduces an arm.

Newly supplied in the latest list:
- Grade 1 Gold
- Grade 3 Ruby

Earlier image labelling included "Nur2 love", while the official latest class-by-class list says "Nursery 2 — Gift". The official list should win, but the school should confirm whether the older photo label was simply incorrect.

======================================================================
5. COMPLETE CURRENT PUPIL REGISTER
======================================================================

The following names are the latest school-supplied roster received on 24 September 2026. Preserve spelling and punctuation. Do not silently "correct" names.

KG 1 — FAITH — 18
1. Akpan Joy
2. Akinola Solomon
3. Akinsomi Mehetabel
4. Ezike Kamsi
5. Emeka Chizaram
6. Okunoye Mohamed
7. Abodunrin Fauziat
8. Obitokun Praise
9. Nwoke Daniel
10. Nwoke Danielle
11. Bakare Azeezah
12. Sodiq Azeezmah
13. Collins Chinweuba
14. Lawal Ayman
15. Prince Ezuma
16. Ifeanyi Rachael
17. Awesu Rashida
18. Akinjolie Allan

KG 2 — JOY — 15
1. Afolayan Fiyinfoluwa
2. Adisa Abudi-Lateef Ademide
3. Aniemena Ifeanyi
4. Amosun Damaris
5. Emeka Derick Kamsi
6. Jayiola Jamal Afeez
7. Ossai Mmesoma
8. Oriade Zaram
9. Orji Light Uchechukwu
10. Omojowo Flourish
11. Okenedum David
12. Okonkwo Beatrice
13. Nnabuike Abigail Otitochukwu
14. Njoku Chiemerie
15. S-ARIBISALA AYOOLUWATOFUNMI

NURSERY 1 — GRACE — 14
1. Bakare Azeema
2. Ezennaya Destiny
3. Ifeanyi Chidiebube
4. Kanayo Christabel
5. Kayode Fikolami
6. Morrison Annabelle
7. Nana Marvellous
8. Nwali Prudence
9. Odinakachukwu Victory
10. Okorola Royal Obieze
11. Okunnu Hameedat
12. Olarenwaju Bryan
13. Onakoya Esther
14. Ossai Chidera

NURSERY 1 — PEACE — 15
1. Abdusalam Abike
2. Adebayo Roheed
3. Adejobi Adeyosola
4. Eze Chibueze
5. Ezike Amanda
6. Fakolade Wonderful
7. Iyke Benita
8. Monday Stanley
9. Ogbonna Delight
10. Okebiorun Joy
11. Okunoye Aishat
12. Onyebuchi Onyinyechi
13. Shobowale Ibrahim
14. Sobaloju Diamond
15. Turner Adebimpe

NURSERY 2 — GIFT — 22
1. Adekunle Azeezat
2. Ajibo Wuraola
3. Akinola Enoch
4. Akinjole Tiffany
5. Aniemena Mmesoma
6. Ezeh O. Munachimso
7. Ikebata Annabel
8. Gbadamosi Al-Ameen
9. Kachukwu Daniel
10. Kester Oluebube
11. Hosea Isabella
12. Olusola Hannah
13. Onyenezi Awesome
14. Omojowo Fortune
15. Ngwu Kamsi
16. Onuoha Chimesirim
17. Paul Chinonso D.
18. Robiu Royyan
19. Rasheed Abeebat
20. Salawudeen Asake
21. Vandi A. Daniella O.
22. Uchenna Ambition

GRADE 1 — EMERALD — 15
1. Ajibola Azeem
2. Antigha Shalom
3. Eze Amanda
4. Ifeanyi Chisimdi
5. Iyke Bright
6. Morrison David
7. Maduagwu Vivian
8. Nana Godson
9. Nwoko Emmanuella
10. Oneh Where
11. Olanrewaju Cephas
12. Okorola Raphael
13. Ogbaro Pamilerin
14. Shobaloju Mustaqeem
15. Nwali Purity

GRADE 1 — GOLD — 15
1. Adejobi Aderinsola
2. Ezenwanne Zoela
3. Mbah Chiagozie
4. Nwoko Emmanuel
5. Obianujio Chukwudubem
6. Ogunjumo Is Real
7. Damilare Deborah
8. Afolayan Iyinoluwa Daniel
9. Collins Odoh Amarachi
10. Amaza Hendrick
11. Okenedum Francisca
12. Salami Azeem
13. Ijoko Gerald
14. Orah Kosiso
15. Okikiola Wahab

GRADE 2 — TOPAZ — 27
1. Olorunrinu Abdulkareem
2. Olorunrinu Kareemah
3. Uchenna Chikaima
4. Kester Chiamanda
5. Oyekanmi Nabeel
6. Azeemat Jimoh
7. Umenyi Success
8. Turner Adetola
9. Orji Sophia
10. Oshodi John
11. Okenedum Munachi
12. Chukwuka Blessed
13. Akinsola Abdulahi
14. Aniemena Mirabel
15. Adebayo Mariam
16. Gbadebo Zakir
17. Mamman Aaron
18. Odili Samuel
19. Ezennaya Chidiomimi
20. Akpan Great
21. Ngwu Chiagozie
22. Dada Joseph
23. Quyum Taiwo
24. Ogbu Precious
25. Perfect Iyke
26. Badru Adunni
27. Iheanacho Chizaram

GRADE 3 — RUBY — 22
1. Adekeye Ire
2. Adebayo Ireayo
3. Adepoju Joshua
4. Adisa Anas
5. Afeez Faheem
6. Ajibo Emmanuel
7. Ajibola Halimah
8. Atigha Bethel
9. Ayoade Mustaqueen
10. Babatunde Dabira
11. Balogun Sumayyah
12. Eze Chikamso
13. Ifebajo Fayo
14. Igbokwe Wealth
15. Ikebata Mirabel
16. Nnachi Great
17. Odinaka Dominion
18. Odoh Lucy Onyinyechi
19. Ogunjumo Christiana
20. Roland Glory
21. Shobowale Aliyah
22. Toheeb Mayowa

GRADE 4 — OPAL — 13
1. Adewole John
2. Ajijola Anita
3. Chukwudi Isabella
4. Chukwuka Excel
5. George Opeyemi
6. Hosea Isaac
7. Mbah Amanda
8. Mmaduagwu Ebube
9. Onitolo Arifdeen
10. Orji-Ndukwe Emekwa
11. Salami Abdulmateen
12. Temidayo Erioluwa
13. Titiola Gracia

GRADE 4 — SAPPHIRE — 13
1. Adenola Judah
2. Adigun Phillip
3. Beyioku Zion
4. Christopher Victory
5. Chuks Grace
6. Emiola Toluwalase
7. Etumudon Me Shack
8. Ezenwanne Cephas
9. Kayode Tikristinimi
10. Kester Chisom
11. Mbah Chisom
12. Mbah Wuraola
13. Ngwu Rita

GRADE 5 — ZIRCON — 13
1. Adeponle Oluwatoni
2. Amaza Harry
3. Anjorin Balikis
4. Ezeh Divine
5. Hosea Precious
6. Ikebata Amanda
7. Mmesoma Victory
8. Okafor King
9. Olasubomi Teniola
10. Oneh Joseph
11. Orah Faustina
12. Umenyi Dominion
13. Yekinni Temidire

GRADE 6 — DIAMOND — 17
1. Adekeye Fiyinfoluwa
2. Agbale Samuel
3. Ajayi Fikun
4. Alade Subomi
5. Animashaun Samad
6. Damilare Victory
7. Ejiofor Rex
8. Ezenwanne Abiela
9. Gbadamosi Testimony
10. Gbadebo Ameenah
11. Michael Jason
12. Ngwu Munachi
13. Ogunyemi Fahama
14. Okoye David
15. Olaoye Ifeoluwa
16. Olorunrinu Abdulkareem
17. Olugbamila Toluwalashe

Notes on names:
- "Olorunrinu Abdulkareem" legitimately appears in Grade 2 Topaz and Grade 6 Diamond. Do not deduplicate by name because they are different pupils in different classes.
- "Ngwu Munachi" and "Okenedum Munachi" are separate pupils.
- Do not normalize names merely because they look unusual.
- "S-ARIBISALA AYOOLUWATOFUNMI" is now the school-confirmed full name supplied on 25 September 2026.

======================================================================
6. DATA REQUESTS ALREADY SENT TO THE SCHOOL
======================================================================

The requested live pupil record fields were:

For every pupil:
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
- Any other field currently kept in the school's official register

Parent/sibling requirements:
- Correct parent/guardian information for every pupil
- Confirmation when a parent has more than one child
- Confirmation that sibling children belong to the same parent account so parent access can be linked correctly

Photo requirements:
- One clear passport-style photo per pupil
- Can be taken on Android or iOS
- Must be matched to admission number or full name
- Photos are needed for ID cards and student profiles

School academic/setup data requested:
- Current class teachers
- Subjects taught in each class
- Specialist-subject arrangements
- Exact 2026/2027 term start/end dates
- Timetables/schedules
- Current assessment dates
- Approved CA/exam rules if different from the existing 40/60
- Official report-card remarks or grading changes
- First official attendance date for the 2026/2027 session
- Whether attendance is recorded daily
- Approved late/absence rules
- Who takes each register (school later clarified this is the class teacher)
- Fee structure
- Due dates
- Discounts/scholarships
- Approved receipt/payment format
- CBT questions/content when ready
- Official report cards, certificates, admission, leave, transfer, policy and other documents that should be reproduced digitally

Transport:
- Originally requested routes/drivers/vehicles/authorised pupils and parent links.
- School has now confirmed bus runs are outsourced.
- School bus tracking is therefore not a current completion requirement.

======================================================================
7. WHAT THE SCHOOL HAS ACTUALLY PROVIDED SO FAR
======================================================================

CONFIRMED / RECEIVED:
- Current class-by-class pupil list — now 219 pupils across 13 classes.
- Grade 1 Gold list.
- Grade 3 Ruby list.
- The school has confirmed the outsourced bus arrangement.
- Older teacher information exists in project context.
- The school understands that further data is needed, but data is arriving in batches rather than as one complete register.

PARTIAL:
- Student photos: only a small number of class/photo messages were received previously.
- Timetables: not yet received.
- Class-teacher/subject/specialist information: not fully confirmed for all 13 current arms.
- Parent/guardian data: not provided as a complete class-by-class register.
- Fees/invoices/receipts: invoices and receipts were requested, but current Supabase finance operational tables are empty after the roster reset.
- Official school documents: not supplied as a complete document pack.
- CBT content: not supplied.
- Admission numbers: not supplied.

NOT YET RECEIVED / STILL NEEDED:
1. Official admission numbers for all pupils.
2. DOB for all pupils.
3. Gender for all pupils.
4. Admission dates where available.
5. Parent/guardian full names.
6. Parent/guardian phone numbers.
7. Parent/guardian emails where available.
8. Parent relationship.
9. Sibling relationships.
10. Home addresses where required.
11. Official pupil photos.
12. Any other fields in the school's register.
13. Current arm-specific class-teacher assignment.
14. Exact subjects taught per current class.
15. Specialist-subject allocation and specialist teachers.
16. Current timetable/schedule for each class.
17. Current assessment dates.
18. Official attendance start date.
19. Attendance/late/absence rules.
20. Official fee structure / due dates / approved discounts.
21. Actual invoice and receipt samples.
22. Report card sample and any official grading/remark changes.
23. Admission/leave/transfer/certificate/policy documents that need digital versions.
24. CBT questions/content when ready.

======================================================================
8. TERMS — CURRENT DATABASE VALUES AND A CONFIRMATION ISSUE
======================================================================

Supabase currently contains:

Term 1:
- Wisdom Term
- Session: 2026/2027
- Start: 2026-09-14
- End: 2026-12-18
- Current: yes

Term 2:
- Excellent Term
- Session: 2026/2027
- Start: 2027-01-11
- End: 2027-04-02

Term 3:
- Glorious Term
- Session: 2026/2027
- Start: 2027-04-19
- End: 2027-07-23

IMPORTANT:
The school supplied the official first-term calendar on 25 September 2026 and confirmed resumption as 14 September 2026. The live Supabase first-term dates now match that confirmation. Full second- and third-term calendar details have not been re-confirmed in this message and should not be invented.

======================================================================
9. SUBJECTS CURRENTLY IN SUPABASE
======================================================================

21 subject records currently exist:

- Abacus
- Basic Science
- Coding
- Creative Art
- CRK
- Diction
- English Language
- French
- Handwriting
- History
- ICT
- IRK
- Mathematics
- Music
- National Value
- Phonics
- Physical & Health Education
- Quantitative Aptitude
- Verbal Aptitude
- Vocational Aptitude
- Yoruba

School-provided specialist-subject context from earlier discussion:
- Diction
- French
- Art & Creative
- Yoruba
- Coding
- Abacus
- Swimming is handled by an outsourced hotel instructor, not normal school staff.

Important:
- class_subjects currently has 0 rows.
- Do not assume every one of the 21 subjects is taught to every class.
- Specialist teachers/allocations have not been fully provided.
- Earlier school clarification: class teachers teach the normal subjects for their own class. The intended model is:
  Teacher -> Assigned Class -> Students -> Subjects -> Attendance / Results / Assignments / Report Card
  not:
  Teacher -> Assigned Subject -> Whole Class
- Specialist subjects can use separate subject-teacher relationships once the school supplies the actual allocation.

======================================================================
10. TEACHER INFORMATION ALREADY KNOWN FROM EARLIER SCHOOL DATA
======================================================================

Earlier teacher data included 18 teacher records in Supabase.

Known class-teacher information from prior intake:
- KG1 — Miss Labake Luyi
- KG2 — Mrs Ifunaya Ohagbulem, Mrs Janet Tuwa
- Nursery 1 — Miss Unyime-Abasi Ukeme, Miss Ada Obumnene
- Nursery 2 — Mrs Egwu Nkechinyere, Mrs Morounntonu Temitope
- Grade 1 — Mrs George Udo-Affia, Miss Kemi Adetutu
- Grade 2 — Mrs Aniekwe Jessica
- Grade 3 — Mr Promise Emmanuel, Miss Esther Oni
- Grade 4 — Mrs Mpamah Anthonia, Mrs Salako Gift
- Grade 5 — Miss Taiwo Abraham
- Grade 6 — Mr Osita Emenike

Do not blindly apply those names to the new arm structure without arm-specific confirmation.
The database has only one classes.class_teacher_id field, while some earlier levels had two teachers. Preserve the distinction until the school confirms how the multiple teachers should be represented.

The latest 13-arm structure introduces:
- Grade 1 Gold
- Grade 3 Ruby
and changes earlier arm names such as Nursery 1 and Nursery 2.

Therefore current class-teacher assignment remains a confirmation task.

======================================================================
11. FEES — KNOWN WORKING CONFIGURATION VS CURRENT LIVE DATA
======================================================================

A previous project data set contained this fee structure:

KG1:
- Tuition 70,000
- PTA 5,000
- Party 10,000
- Lesson 15,000
- Total 100,000

KG2:
- Tuition 80,000
- PTA 5,000
- Party 10,000
- Lesson 15,000
- Total 110,000

Nursery 1:
- Tuition 95,000
- PTA 5,000
- Party 10,000
- Lesson 15,000
- Total 125,000

Nursery 2:
- Tuition 95,000
- PTA 5,000
- Party 10,000
- Lesson 15,000
- Total 125,000

Grade 1–3:
- Tuition 115,000
- PTA 5,000
- Party 10,000
- Lesson 15,000
- Total 145,000

Grade 4–6:
- Tuition 120,000
- PTA 5,000
- Party 10,000
- Lesson 15,000
- Total 150,000

IMPORTANT STATUS:
- Treat this as previously supplied project information, not a new confirmation from the latest school register.
- Current live Supabase fee_items = 0 after the roster reset.
- Current invoices = 0.
- Current receipts = 0.
- Current discounts = 0.
- Do not invent current invoices/payments.
- Ask the school to confirm the approved fee structure/due dates and provide invoice/receipt samples before restoring finance data as official live records.

Finance logic in the application:
- Invoice total = fee item snapshots for the relevant term minus approved discount.
- Outstanding = invoice total minus confirmed payments.
- Invoice lines are intended as snapshots so later fee changes do not rewrite old invoices.
- Paystack remains placeholder/disabled until the school has a school-owned provider account/configuration.
- No payment-provider secret belongs in GitHub or frontend code.

======================================================================
12. GRADING / REPORTING CONFIGURATION
======================================================================

Existing project configuration:
- CA = 40
- Exam = 60
- Total = 100
- Promotion average = 60

Existing remark scale in TypeScript:
- 90–100: Outstanding
- 80–89: Excellent
- 70–79: Very Good
- 60–69: Very Good
- 50–59: Good
- 40–49: Fair
- 0–39: Poor

The DB also has A–F letter grades.

Historical invalid sample grade rows existed before the roster reset. They included totals above 100. The project tightened new-score bounds so future CA/exam input follows 0–40 and 0–60.

The latest school data request still asked the school to confirm whether the official 40/60 rules and report-card remarks are unchanged.
Do not assume the latest project configuration is necessarily the school's final signed-off policy.

======================================================================
13. PRODUCT / FEATURE SURFACE
======================================================================

The application is intended to provide:

ADMIN:
- Command centre dashboard
- Student management
- Staff/teacher management
- Class management
- Subjects
- Attendance oversight
- Gradebook/result oversight
- Report cards
- Admissions
- Finance
- Invoices
- Receipts
- Discounts/scholarships
- ID card generation
- Certificates
- Admission register
- Bulk upload
- Documents/policies
- User/role management
- Notifications/messaging
- Analytics
- System settings
- Portal switching
- Transport foundation
- Other school operations

STAFF:
- Dashboard
- Community Wall
- Students
- Classes
- Attendance
- Gradebook
- CBT Studio
- Assignments/homework
- Lesson Plans
- Reports
- Report Cards
- Admissions
- Messages
- Forum
- Leave
- Profile

STUDENT:
- Dashboard
- Results
- Report Cards
- Transcript
- CBT Exams
- Homework
- Learning Hub
- Library
- Schedule
- Attendance
- Calendar
- Announcements
- Community Wall
- Complaints
- Fee Payments
- Profile
- Settings
- AI Tutor
- Calculator

PARENT:
- Dashboard
- Community Wall
- Children's Grades
- Attendance
- Fees & Payments
- Messages
- Forum
- School Bus
- Profile

TRANSPORT:
- Driver role and driver dashboard exist technically.
- Parent transport page exists technically.
- School has confirmed transport is outsourced.
- Do not prioritise transport work now.

======================================================================
14. STUDENT AI TUTOR — INTENDED BEHAVIOUR
======================================================================

The school requested that the AI help students learn instead of simply doing everything.

Correct intended behaviour:
For homework/problem-solving:
- Guide the method.
- Ask a useful question.
- Explain the underlying concept.
- Give hints.
- Show a similar worked example when useful.
- Do not simply output the final homework answer without teaching.

For straightforward factual/general-knowledge questions:
- Answer clearly and accurately.
- Correct mistaken or uncertain premises gently.
- It is acceptable to answer direct factual questions.

Implementation:
- Supabase Edge Function: ai-assistant
- JWT verification was enabled.
- Prompt was updated to nursery/primary-focused tutoring behaviour.
- Student feature settings are controlled by student_feature_settings.

Current user-reported issue:
- The AI Tutor UI/button has at times appeared to do nothing when clicked.
- The current StudentTools component listens for:
  imagemakers-open-ai
  and
  imagemakers-open-calculator
- The AIChatWidget exists and can open.
- This interaction still needs real browser/runtime verification because the user has reported the click path not working.

Do not consider the AI feature finished just because the edge function exists.

======================================================================
15. CALCULATOR — INTENDED BEHAVIOUR
======================================================================

The student calculator should be a real student study tool, not a fake button.

Current component:
src/components/StudentTools.tsx

Current intended functionality:
- Open a calculator panel/modal.
- Accept basic arithmetic.
- Supports +, -, *, / and percentage syntax.
- Converts ×, ÷ and − to JavaScript operators.
- Shows a result or validation message.
- Respects calculator_enabled in student_feature_settings.

Current user-reported issue:
- Clicking the calculator UI from the student dashboard has at times done nothing.
- The component now has event listeners, but browser verification is still required.

Do not mark this complete until the actual student-dashboard click path is tested.

======================================================================
16. STUDENT PORTAL UI / UX REQUIREMENTS
======================================================================

This is a major design requirement.

School brand colour:
- SKY BLUE is the core student/staff visual direction.
- Do NOT default to green.
- Gradients, tints, pale sky surfaces, navy text, glass effects and subtle complementary accents are allowed.
- Avoid a green-heavy student or staff portal.
- Admin has its own established admin palette and should not be recoloured into the student/staff palette.

User's preferred student navigation:
- Keep the liquid-glass bottom navigation concept.
- Keep a real sidebar on desktop.
- Do NOT add a redundant top navigation bar.
- The current student implementation has a top header + module drawer and does not match the desired final navigation model.
- The desired result should be:
  desktop: left sidebar + main page;
  mobile: useful mobile header plus liquid-glass bottom nav, without three simultaneous nav systems.
- The student portal should not have sidebar + bottom nav + an unnecessary third top nav all competing at once.

Student visual direction:
- Attractive and modern.
- Sky-blue-forward.
- Gradient/tinted surfaces.
- Liquid glass where appropriate.
- Small animations and motion details.
- Editorial spacing.
- Distinct visual identity for major modules.
- Avoid repetitive identical icons for unrelated features.
- Avoid ugly generic SVG illustrations.
- Prefer high-quality illustration-style imagery/graphics or carefully designed CSS/illustration systems.
- Avoid generic AI-looking hero photos.
- Do not copy another product's colour palette exactly; use the school's sky-blue identity.

Student homepage:
- Previous user feedback: homepage hero image looked generic and unattractive.
- User gave creative control to rework the homepage and footer.
- Requested a more interesting homepage, with sky blue, gradients, subtle animation and attractive small details.
- Homepage should feel intentional rather than like a generic school dashboard template.
- AI Tutor and Calculator must be directly usable from the interface.

Pages requested for complete redesign, not just sidebar/icon changes:
- Results
- Report Cards
- Transcript
- Attendance
- CBT
- Homework
- Learning Hub
- Library
- Schedule
- Calendar
- Announcements
- Community Wall
- Complaints
- Fees
- Profile
- Settings
and other student pages as needed.

"Redesign" means:
- layout
- spacing
- typography
- colours
- gradients/tints
- cards
- buttons
- backgrounds
- illustrations
- interactive states
- mobile behaviour
- footer
- empty states
- loading states
- errors
while preserving the meaning and functionality of the page.

======================================================================
17. STAFF PORTAL UI / UX REQUIREMENTS
======================================================================

The user explicitly said the staff dashboard and staff pages had not been redesigned deeply enough.

Current staff shell:
src/components/layout/StaffLayout.tsx

Current staff dashboard:
src/pages/staff/StaffDashboard.tsx

The current staff dashboard has:
- sky-blue accents (#2f8fca)
- dashboard hero
- KPI/stat cards
- teaching schedule
- StaffClockIn
- attention area
- workbench cards
- activity metrics

But the user wants:
- a stronger blue identity.
- less washed-out white space.
- a polished school-professional visual hierarchy.
- a better-looking sidebar while keeping the sidebar concept.
- each staff page to have its own deliberate design treatment.
- no "information dumped at the bottom".
- content should be distributed spatially.
- different sections should create visual rhythm.
- cards, buttons, tables/forms and empty states should use the same visual language.
- do not simply recolour a page and call it redesigned.

Staff pages needing design work include:
- Dashboard
- Community Wall
- Students
- Classes
- Attendance
- Gradebook
- CBT Studio
- Assignments
- Lesson Plans
- Reports
- Report Cards
- Admissions
- Messages
- Forum
- Leave
- Profile

Functionality must be preserved.

Staff identity model:
- A normal class teacher should be scoped to the class they are assigned to.
- Normal class subjects are handled by the class teacher.
- Specialist teacher permissions should be narrower and based on confirmed subject allocations.

======================================================================
18. PARENT PORTAL UI / UX REQUIREMENTS
======================================================================

Parent portal now opens after a previously reported runtime error, but visual/design improvements are still needed.

Important previous crash:
"Something went wrong on this page"
"PortalIllustration is not defined"

Current source now imports PortalHeroArt in ParentDashboard, not PortalIllustration. Current main should be tested in a real build/browser to confirm the reported runtime crash is actually gone.

Parent dashboard feedback:
- The dashboard should not have a massive information dump at the bottom.
- Important information should be scattered into purposeful sections throughout the page.
- Child overview, grades, attendance, fees, announcements, homework/exams and quick actions should be distributed logically.
- The hero illustration previously used was considered ugly.
- Bottom feature illustrations were acceptable enough but the hero art should be replaced/refined.
- Parent portal should use school sky blue / tasteful glass and gradient treatments rather than turning into a green-heavy UI.

Parent access from Admin:
- Admin preview access was explicitly needed.
- Admin routes to parent portal were added to allowed roles.
- ParentDashboard has an admin preview branch that avoids trying to query admin as a normal linked parent.
- This must still be tested, not just assumed correct.

======================================================================
19. ADMIN PORTAL UI REQUIREMENTS
======================================================================

Admin portal has a distinct established visual identity and should keep it.

Important:
- The first part of the Admin Dashboard — "Imagemakers command centre", "Welcome back, Admin", portal cards — was described by the user as already good and should not be arbitrarily redesigned.
- Do not turn admin into the same sky-blue student/staff palette.
- Admin sidebar/portal switcher is already dark/navy and should remain distinct.
- User previously asked for different sidebar icons and no repeated icon for multiple items.
- Existing admin illustration system is the exception to the general "avoid ugly SVGs" direction because the user specifically allowed existing admin SVGs.

Admin portal switcher contains:
- Staff
- Student
- Parent
- Driver (driver is no longer a current priority)

======================================================================
20. ID CARDS
======================================================================

ID card generation exists at:
- /admin/id-cards

The design needs a visual refresh according to the user's previous feedback.

Desired direction from the project specification:
- portrait ID-card proportions
- front/back previews
- school branding
- sky-blue header
- pupil photo
- full name
- admission number
- class
- QR code
- parent access information on back

Current data blocker:
- Official admission numbers are still missing.
- Official pupil photos are largely missing.
- Therefore ID cards can be redesigned now, but official final cards cannot be treated as ready until the school supplies the real data.

======================================================================
21. COMMUNITY WALL
======================================================================

Community Wall is a separate feature and must not be confused with messaging/forum.

Important UI request:
- Do NOT use a generic message/chat icon to represent the forum or community wall.
- Use a distinct visual identity for community content.
- Redesign the wall in the relevant portals so it does not look like an old generic feed.
- A wall should clearly distinguish:
  composer
  post
  comments
  reactions
  author/timestamp
  media
  empty state

Existing functional documentation describes:
- single-column feed
- composer
- optional image
- reaction chips
- comment count
- nested comments / reply input

======================================================================
22. HOMEWORK / ASSIGNMENTS
======================================================================

Homework is represented by assignments.

Staff:
- /staff/assignments
- create/list homework
- due date
- max score
- class
- subject

Student:
- /student/homework

Parent:
- parent dashboard can surface upcoming homework for linked children.

User requested:
- actual visual redesign, not just a new sidebar.
- clear due-date hierarchy.
- status states.
- empty states for no homework.
- student-friendly learning presentation.
- teacher-oriented creation/review presentation.

Current live assignments:
- 0 after roster reset.

Do not create fake homework.

======================================================================
23. CBT
======================================================================

Staff CBT:
- /staff/cbt
- redesigned concept: Assessment Studio
- create exam
- add MCQ questions
- options stored in JSONB
- correct index
- publish toggle

Student CBT:
- /student/exams
- /student/... TakeExam runner

Existing backend:
- exams
- exam_questions
- exam_submissions

Important functional gap from older engineering audit:
- Server-side CBT scoring was identified as a required functional gap.
- Earlier spec said CBT exams existed but were not reliably scoring usable results.
- Do not assume CBT is production complete until scoring/submission/results are tested.

Current live CBT data:
- 0 exams
- 0 exam_questions
- 0 exam_submissions

Do not create fake exams.

======================================================================
24. ATTENDANCE
======================================================================

The school's latest clarification:
- Attendance is taken by the class teacher.
- Do not model the normal class teacher as a specialist-subject owner just to grant attendance access.

Current live attendance:
- 0 rows.

School still needs to provide/confirm:
- first official attendance date for 2026/2027
- whether attendance is daily
- late/absence rules
- any official attendance conventions

Student record fields requested from the school include admission number because attendance and ID/registration processes need reliable pupil identity.

Database integrity:
- A unique index/constraint for student/date attendance was added previously to reduce duplicate daily attendance records.

======================================================================
25. TRANSPORT
======================================================================

Technical transport foundation exists:
- driver role
- transport_driver_profiles
- transport_trips
- transport_location_points
- transport_student_links
- driver dashboard /driver
- parent transport /parent/transport

The school explicitly said:
"No need for it. We outsource it."

Therefore:
- do not spend current project time polishing/expanding the driver portal;
- do not ask the school for driver/route data again unless transport ownership changes;
- treat this as deferred/inactive.

======================================================================
26. PARENT / FAMILY ACCOUNT MODEL
======================================================================

Parent access should be based on explicit parent-student links.

Current:
- parent_student_links = 0

Needed:
- parent full name
- parent phone/email
- relationship
- which children they belong to
- sibling linking confirmation

Do not infer that two pupils with the same surname have the same parent.
Do not infer sibling relationships from names.
Do not link accounts until school confirms.

======================================================================
27. SECURITY / BACKEND ENGINEERING STATE
======================================================================

Security work previously completed includes:
- RPC execution restrictions for public role-management helper functions
- unique attendance student/date protection
- CA score upper bound of 40
- exam score upper bound of 60
- student feature settings with RLS
- JWT verification on AI edge function
- transport route-scoped RLS foundation
- teacher class-scope work for attendance/gradebook

Known outstanding security/production items from prior engineering audit:
- leaked-password protection in Supabase remained disabled
- certificates anonymous/public read concern required remediation
- some SECURITY DEFINER/RLS/performance findings may remain
- teacher-level access still needs continued verification across all staff pages
- admin permission flags need either enforcement or removal
- activity logging was not fully wired
- report-card editor had previously been disconnected from database
- signed photo URL handling may need improvement
- self-sign-up exposure had been identified as a concern
- CBT scoring needed work

Important:
Do not say "fully secure" unless a fresh advisor/security audit proves it.

======================================================================
28. CURRENT DATABASE SCHEMA RELEVANT TO PUPIL DATA
======================================================================

students includes:
- id
- user_id
- student_id
- first_name
- last_name
- middle_name
- email
- phone
- address
- date_of_birth
- gender
- nationality
- state_of_origin
- religion
- blood_group
- bio
- hobbies
- photo_url
- emergency_contact
- guardian_name
- guardian_phone
- guardian_email
- guardian_relation
- class_id
- programme_id
- admission_date
- status
- created_at
- updated_at
- section
- parent_phone
- is_verified
- parent_id
- parent_code
- public_token

classes includes:
- id
- name
- level
- arm
- room
- class_teacher_id
- programme_id
- capacity
- created_at
- updated_at
- grade_level
- school_type
- specialization

student_feature_settings:
- student_id
- ai_tutor_enabled
- calculator_enabled
- updated_by
- updated_at

Important:
The schema already supports many fields the school was asked to supply. Do not create new duplicate columns simply because the school has not filled existing ones.

======================================================================
29. DATA INTEGRITY RULES
======================================================================

Never:
- fabricate admission numbers
- fabricate photos
- fabricate parent accounts
- fabricate DOB/gender
- fabricate marks
- fabricate attendance
- fabricate timetables
- fabricate fee payments
- fabricate receipts/invoices
- fabricate CBT questions
- fabricate specialist teacher assignments
- fabricate report-card results

Use honest empty states when live data is missing.

When a school document has a typo/odd name:
- preserve the supplied value;
- ask for confirmation before changing an official value.

======================================================================
30. IMPORTANT CURRENT UI/CODE ISSUES TO PICK UP
======================================================================

Current user-reported problems and desired work:

STUDENT:
- AI Tutor click path sometimes does nothing.
- Calculator click path sometimes does nothing.
- Student navigation architecture is wrong: user wants desktop sidebar + liquid-glass mobile bottom nav, without a redundant top navigation bar.
- Homepage visuals were considered generic/ugly.
- Footer needs redesign.
- User wants full student-page redesign, not only shell tweaks.
- Results page needs redesign.
- Transcript needs redesign.
- Attendance needs redesign.
- CBT/list/runner need redesign and must load real content when data exists.
- Homework needs redesign.
- Community Wall needs redesign.
- Illustrations should be attractive and not repetitive ugly SVGs.
- Use sky blue and tasteful gradients/tints.
- Add subtle animation.
- Keep the interface school-friendly and not overly futuristic.

STAFF:
- Dashboard should feel more blue.
- Too much empty/white feeling in the sidebar/page in places.
- User says staff redesign has not gone deep enough.
- Redesign all staff pages individually while preserving functions.
- Avoid dumping all content at the bottom.
- Distribute information with intentional layout.
- Staff sidebar icons can remain conceptually useful, but avoid repetitive meaning/icon choices.

PARENT:
- Portal now opens after earlier crash, but this must be verified.
- Remove the massive information dump at the bottom.
- Scatter useful information across meaningful sections.
- Hero illustration needs replacement/refinement.
- Keep parent portal visually consistent with school branding, not green-heavy.

ADMIN:
- Keep the established admin visual identity.
- Do not recolour the admin dashboard to match student/staff.
- Avoid repeated icons.
- Preserve the good first-section command-centre experience.

======================================================================
31. IMPORTANT SOURCE CODE FILES
======================================================================

Key files already observed in GitHub include:

Student:
- src/components/layout/StudentLayout.tsx
- src/components/StudentTools.tsx
- src/components/AIChatWidget.tsx
- src/pages/student/StudentDashboard.tsx
- src/pages/student/StudentExams.tsx
- src/pages/student/TakeExam.tsx

Staff:
- src/components/layout/StaffLayout.tsx
- src/pages/staff/StaffDashboard.tsx
- src/pages/staff/StaffAttendance.tsx
- src/pages/staff/StaffGradebook.tsx
- src/pages/staff/StaffStudents.tsx
- src/pages/staff/StaffCBT.tsx

Parent:
- src/components/layout/ParentLayout.tsx
- src/pages/parent/ParentDashboard.tsx
- src/pages/parent/ParentTransport.tsx

Admin:
- src/components/layout/AdminLayout.tsx
- src/pages/admin/AdminDashboard.tsx
- src/components/PortalIconArt.tsx

Global:
- src/index.css
- src/portal-overrides.css
- src/App.tsx
- package.json
- docs/FUNCTIONAL_SPEC.md

Supabase Edge Function:
- src/supabase/functions/ai-assistant/index.ts

======================================================================
32. PREVIOUS DESIGN / IMPLEMENTATION DIRECTION
======================================================================

The project has had multiple visual passes.

The user strongly rejects:
- generic dashboard templates
- excessive green
- generic hero images
- repeated book/message icons
- ugly stock-looking SVG illustrations
- changing only icons and calling it a redesign
- leaving pages untouched while redesigning only one shell
- large information dumps at page bottoms
- unnecessary duplicated navigation systems
- overuse of white empty space
- AI-looking stock illustrations

The user likes:
- liquid-glass UI
- gradients
- subtle tints
- attractive cards
- strong layout rhythm
- sky blue school branding
- mobile-friendly editorial layouts
- clean but distinctive visuals
- good animation details without making the app feel childish
- different visual treatment per portal
- clear functional navigation

Do not use the previous green-heavy design as the new default.

======================================================================
33. PHOTOS RECEIVED SO FAR
======================================================================

In an earlier WhatsApp exchange the school sent a small number of images with labels:
- Grade 4 Sapphire
- Nur2 love
- Grade 4 Opal
- Kg1faith

These should NOT be treated as a complete photo register.

Important:
- The "Nur2 love" label conflicts with the latest official roster's "Nursery 2 — Gift".
- Photos need to be matched individually to full official names/admission numbers.
- Do not guess which pupil is in a photo based only on class.

======================================================================
34. COMMUNICATION HISTORY — WHY THE CURRENT REQUEST IS DIFFERENT
======================================================================

The school initially told the service provider that student names would be sent once the majority of pupils resumed.

The service provider then requested the data needed for live system population, including:
- class-by-class register
- parent information
- photos
- teacher assignments
- terms/timetable
- attendance rules
- fee documents
- official school documents
- CBT content
- transport only if used

The school has now supplied the class-by-class pupil names, but much of the supporting data is still missing.

The correct communication approach is:
- acknowledge what has been received;
- do not sound frustrated;
- do not repeatedly resend the entire long request;
- ask for the remaining items in manageable batches;
- state that class-by-class/batch submission is acceptable;
- identify one or two blockers clearly;
- do not use excessive praise or "Sir" repeatedly after the conversation is already established.

======================================================================
35. MESSAGE TO SEND TO THE SCHOOL COORDINATOR
======================================================================

Use this as the next WhatsApp message:

Good morning.

Thank you for sending the updated class-by-class pupil list. I have received it and I have now updated the school register with the current pupils and their classes.

I just need the remaining information required to complete the live pupil records and the other school sections properly. The main outstanding items are the official admission numbers, date of birth, gender, admission date where available, parent/guardian details and sibling relationships, student photographs, the confirmed class-teacher assignments, class timetables/subjects, the official attendance start date and rules, and the approved fee/invoice/receipt information.

You can send these in batches, class by class, so everything does not have to come at once. For the photographs, each photo should be matched to the pupil's full name or admission number.

The full official name for the KG 2 pupil has now been confirmed as "S-ARIBISALA AYOOLUWATOFUNMI". The latest official class list also confirms Nursery 2 — Gift; do not reopen that question unless the school provides a newer conflicting record.

There is no need to send the school bus information again for now; I have noted that the transport is outsourced.

Thank you.

======================================================================
36. WHAT TO ASK FOR FIRST
======================================================================

The most useful next batch is NOT another general reminder.

Priority data package:
A. Official admission number + full name + class for every pupil.
B. Parent/guardian mapping for every pupil.
C. Photos matched to pupil names/admission numbers.
D. Timetables for the 13 classes.
E. Current class-teacher assignment.
F. Official term calendar.
G. Fee/invoice/receipt documents.

Why:
- A-C unlock identity, parent accounts and ID cards.
- D-E unlock schedules, teacher scope and class operations.
- F unlocks accurate current-term logic.
- G unlocks finance.

The school can send A-C as Excel/CSV/WhatsApp batches if that is easier.

======================================================================
37. FUTURE AI IMPORT PROMPT
======================================================================

Paste the following into a fresh AI/chat session whenever continuing the project:

"You are taking over an existing software project for IMAGEMAKERS NURSERY AND PRIMARY SCHOOL.

Do NOT start from scratch.
Do NOT invent missing school data.
Do NOT assume older project information is still current when a newer school message contradicts it.

Repository:
Compound-Website-Development/uni-school-hub-71

Supabase:
weqzvfpzuybyuvruumae

Read and inspect:
- docs/IMAGEMAKERS_SMS_PROJECT_HANDOFF.md
- docs/FUNCTIONAL_SPEC.md
- the current GitHub main branch
- the live Supabase schema and live row counts

Treat the latest school-supplied pupil roster in the handoff file as the current 2026/2027 pupil list.

Current verified live roster:
- 219 pupils
- 13 classes
- classes: KG1 Faith, KG2 Joy, Nursery1 Grace, Nursery1 Peace, Nursery2 Gift, Grade1 Emerald, Grade1 Gold, Grade2 Topaz, Grade3 Ruby, Grade4 Opal, Grade4 Sapphire, Grade5 Zircon, Grade6 Diamond
- 219 student_feature_settings
- parent_student_links = 0
- grades = 0
- attendance = 0
- exams = 0
- assignments = 0
- invoices = 0
- fee_items = 0
- class_subjects = 0
- schedules = 0

IMPORTANT DATA RULE:
The student_id values currently look like PENDING-2026-### and are temporary placeholders, not official admission numbers. Admission numbers are still missing. Do not call them official.

IMPORTANT SCHOOL DATA RULE:
The school still owes DOB, gender, admission dates, parent details, sibling links, photos, current class-teacher assignments, timetables, specialist subject mappings, official attendance rules, fee/invoice/receipt data, report-card/document samples and CBT content.

IMPORTANT TRANSPORT RULE:
The school confirmed that bus transport is outsourced. Do not prioritise the driver portal or bus tracking.

IMPORTANT VISUAL RULE:
Use the school's sky-blue identity for Student and Staff work. Do not make the Student/Staff/Parent portals green-heavy. Gradients, pale sky tints, navy text, glass surfaces and subtle complementary accents are allowed. Admin retains its separate dark/navy command-centre palette.

IMPORTANT STUDENT NAVIGATION RULE:
The desired Student portal is desktop sidebar + mobile liquid-glass bottom nav. Do not introduce a third unnecessary navigation bar. Keep the mobile bottom navigation concept.

IMPORTANT DESIGN RULE:
A redesign means changing actual page composition, spacing, typography, cards, buttons, backgrounds, illustrations, empty/loading/error states, interactions and mobile behaviour while preserving functionality. Do not just recolour a sidebar and call the page redesigned.

IMPORTANT ILLUSTRATION RULE:
Avoid generic/ugly SVG artwork and repetitive symbols. Use attractive illustration-style visuals or carefully crafted UI art that fits the school branding. Do not use the same icon for unrelated features.

IMPORTANT AI TUTOR RULE:
For homework/problem solving, teach and guide rather than simply giving the final answer. For straightforward factual/general-knowledge questions, answer clearly and accurately.

IMPORTANT CURRENT USER-REPORTED ISSUES:
- Student AI Tutor click path sometimes does nothing.
- Student Calculator click path sometimes does nothing.
- Student portal navigation currently does not match the desired sidebar + liquid-glass bottom nav arrangement.
- Student homepage/hero/footer visuals need a substantial redesign.
- Student results, transcript, attendance, CBT, homework, wall and other pages need actual redesign, not just shell changes.
- Staff dashboard needs a stronger blue identity and deeper redesign.
- All staff pages need intentional visual redesign.
- Parent dashboard needs content redistributed instead of a large information dump at the bottom.
- Parent hero illustration needs replacement/refinement.
- A previous parent crash said 'PortalIllustration is not defined'; current source no longer uses that symbol in ParentDashboard, but verify with a real build/runtime.
- Admin should keep its established separate visual identity.

ENGINEERING WORK STYLE:
1. Inspect GitHub first.
2. Inspect live Supabase state before making assumptions.
3. Change actual code rather than merely writing a Lovable prompt when implementation is requested.
4. Preserve existing functionality and data relationships.
5. Run/attempt a build or runtime verification when possible.
6. If verification is impossible, state exactly what was and was not verified.
7. Update docs/IMAGEMAKERS_SMS_PROJECT_HANDOFF.md and docs/FUNCTIONAL_SPEC.md when substantial project state changes.
8. Never say a deployment is live unless a public URL was actually checked.

PICK UP FROM WHERE WE LEFT OFF:
The latest work loaded the school's newest 219-pupil roster into Supabase and created the missing Grade 1 Gold and Grade 3 Ruby classes. The next engineering task should begin by checking the current GitHub branch for the remaining Student/Staff/Parent UI issues and checking the current Supabase state before modifying anything else.

Do not waste time summarising the whole conversation back to me. Use the handoff file as the context and start from the current state."

======================================================================
38. RECOMMENDED NEXT ENGINEERING ORDER
======================================================================

Phase A — data correctness:
1. Verify 219 pupils and 13 classes.
2. Confirm no old sample pupils remain.
3. Confirm temporary student IDs are clearly treated as placeholders.
4. Confirm the two new classes exist.
5. Fix/confirm any mismatched class names.
6. Do not load invented parent/finance/attendance data.

Phase B — runtime correctness:
1. Build the current repository.
2. Check ParentDashboard runtime.
3. Check StudentDashboard click handlers for AI Tutor and Calculator.
4. Check StudentLayout navigation.
5. Check staff dashboard route and key staff routes.
6. Check student CBT/results/transcript routes.
7. Check parent preview route.

Phase C — Student UX:
1. Restore intended desktop sidebar.
2. Restore liquid-glass mobile bottom nav.
3. Remove redundant top navigation.
4. Rebuild homepage/hero/footer.
5. Redesign pages individually.
6. Make AI/Calculator controls actually open.
7. Verify mobile and desktop breakpoints.

Phase D — Staff UX:
1. Deep redesign StaffDashboard.
2. Make blue identity clearly dominant.
3. Redesign Students.
4. Redesign Attendance.
5. Redesign Gradebook.
6. Redesign CBT Studio.
7. Redesign Assignments.
8. Redesign Lesson Plans.
9. Redesign Reports.
10. Redesign Report Cards.
11. Redesign Admissions.
12. Redesign Messages/Forum/Wall.
13. Redesign Leave/Profile.

Phase E — Parent UX:
1. Redistribute dashboard content.
2. Replace hero art.
3. Make child cards meaningful.
4. Improve grades/attendance/fees sections.
5. Verify admin preview.
6. Ensure empty state is honest when no parent links exist.

Phase F — school data import:
1. Official admission numbers.
2. Parent/sibling mapping.
3. Photos.
4. Timetables.
5. Teachers.
6. Subject allocations.
7. Attendance rules.
8. Fee documents.
9. Official report-card/documents.
10. CBT content.

======================================================================
39. HISTORICAL ENGINEERING CHANGES WORTH PRESERVING
======================================================================

Previously completed work includes:
- tightened school data integrity and RPC access
- attendance duplicate protection
- bounded new CA/exam score input
- student_feature_settings
- JWT-protected AI edge function
- teacher class-scope logic for attendance and gradebook
- admin portal switching
- parent admin-preview handling
- messaging-to-admin helper path
- transport foundation
- staff dashboard visual work
- student tools wiring
- student CBT visual work
- parent transport visual work
- custom portal visual layers
- Vercel/GitHub workflow clean-up work

Do not re-create these from scratch without inspecting the current main branch.

======================================================================
40. GITHUB / DEPLOYMENT HISTORY NOTES
======================================================================

A GitHub functional-spec sync workflow was deleted previously:
.github/workflows/functional-spec-sync.yml

A script:
scripts/update-functional-spec.mjs
was not successfully deleted at that time and may still exist. It was not in package.json scripts.

Vercel:
- The repository previously triggered connected Vercel deployments.
- At one point one Vercel deployment completed successfully while other connected projects remained pending.
- Later deployment checks showed a Vercel build-rate-limit/quota issue.
- Therefore deployment must be re-checked rather than assumed fixed.
- Never claim production live without verification.

======================================================================
41. WHAT NOT TO DO IN THE NEXT CHAT
======================================================================

Do not:
- ask the user to paste the entire previous conversation again;
- ignore this handoff file;
- rebuild the database from scratch;
- invent missing school records;
- change school brand colours to green;
- remove the student bottom navigation;
- add redundant navigation bars;
- redesign only the sidebar;
- change the admin palette because Student/Staff use sky blue;
- reuse one icon for multiple unrelated functions;
- use generic AI-looking hero artwork;
- call placeholder IDs official admission numbers;
- create fake homework, attendance, payments, grades or CBT questions;
- ask the school for transport details again right now;
- claim a page works without runtime/build verification.

======================================================================
42. SUCCESS CRITERIA
======================================================================

The system is considered ready for the next stage when:
- 219 current pupils are present with the correct 13 classes.
- official admission numbers replace placeholders.
- parent/guardian relationships are mapped correctly.
- sibling relationships are confirmed.
- student photos are matched.
- current teacher/subject/timetable data is loaded.
- term dates are school-confirmed.
- attendance rules are school-confirmed.
- fees/invoices/receipts use actual school data.
- report cards use canonical DB-backed results.
- CBT scoring works.
- Student AI Tutor opens and behaves as a tutor.
- Student Calculator opens and works.
- Student navigation has desktop sidebar + mobile liquid-glass bottom nav without redundant bars.
- Student pages are actually redesigned.
- Staff pages are actually redesigned.
- Parent dashboard is visually distributed rather than an information dump.
- Admin keeps its distinct command-centre identity.
- no major runtime route errors remain.
- no fake school data is shown as real.
- security findings have been re-audited before production.

END OF HANDOFF


======================================================================
POST-AUDIT RECONCILIATION — 25 SEPTEMBER 2026
======================================================================

This section records the verified post-audit state after reconciling the latest school WhatsApp material, historical project context, GitHub and live Supabase.

Verified live counts:
- students: 219
- classes: 13
- teachers: 17 school-supplied active staff records remain after removing one confirmed sample/test teacher row
- subjects: 21
- terms: 3
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
- school_events: 18
- policy_documents: 0
- staff_attendance: 0

Historical reconciliation decisions:
- The latest 13-arm pupil structure remains authoritative.
- No old class arm was reintroduced.
- The 17 teacher records explicitly supplied in the 10 August school list were reconciled against live records.
- Two live teacher fields were corrected to match the latest supplied source where the source and live record differed.
- One extra live teacher row was confirmed as sample/test data with no class, subject, assignment, grade or attendance dependency and was removed. No school-supplied teacher was removed.
- Current class-teacher assignments are not fully complete: four current arms have no class_teacher_id. The school did not supply enough arm-specific assignments in the source material to safely fill those gaps.
- No parent links, grades, attendance, exams, assignments, finance transactions, schedules or events were fabricated.
- Temporary PENDING-2026-### pupil IDs remain placeholders and are not official admission numbers.
- The exact official school registration number is still not present in the available source evidence. The school only confirmed that a registration number exists.
- The school supplied the official first-term calendar on 25 September 2026: 14 September 2026 resumption, 18 December 2026 closing, theme STRIVING FOR EXCELLENCE. The live first-term record now matches that confirmation. Second- and third-term dates remain unconfirmed by this latest message.
- School approval information already documented in project history is LASG Approval No. SLR/14097. This is distinct from the school's registration number.

Privacy:
- Do not add pupil names, guardian details, pupil photos or other sensitive school records to public documentation.


======================================================================
LATEST SCHOOL-DATA RECONCILIATION — 25 SEPTEMBER 2026
======================================================================

- The school is collecting current pupil/parent information through a Google Form because it wants current data rather than the older school-held records. Responses will be supplied in batches, latest expected by next week. Treat missing pupil/parent fields as pending source data, not as a school-side failure.
- The KG2 pupil previously recorded as "S---Aribisala" is now confirmed as "S-ARIBISALA AYOOLUWATOFUNMI" and the live student record has been updated.
- Official first-term calendar: 14 September 2026 to 18 December 2026. Theme: STRIVING FOR EXCELLENCE.
- 18 named first-term calendar events are now in `school_events`.
- School location was confirmed as accurate: 38E Nathan Street, Off Ojuelegba Road, By Surulere Baptist Church, Surulere, Lagos. Actual clock-in coordinates, attendance radius and cutoff remain unconfirmed.
- Fees have no fixed due date; installment payments are allowed through the last day.
- Textbook sales are concluded. Do not add textbook charges unless requested later.
- School bus service no longer operates.
- New fee reference information: Monday/Tuesday uniform pair ₦26,500; Wednesday wear ₦10,000; Friday wear ₦10,000; Taekwondo ₦18,000; Red Cross ₦12,000; Cub Scout ₦18,000; Brownie ₦12,000. Each child is expected to belong to one club. These amounts are stored as school-setting reference data, not billable fee_items, because optional club selection is not yet modelled safely in the current invoice generator.
- Class-teacher data was updated only where the supplied name could be safely matched to the existing 17-teacher roster. Grade 1 Gold, Nursery 1 Peace and Grade 4 Opal remain unassigned. The school supplied Miss Benita for Grade 4 Sapphire, conflicting with the existing live assignment; this was not overwritten without identity confirmation.
- Subject allocations, specialist-teacher mapping, timetables, CA/exam weighting, late/absence rules, and full pupil/parent records remain pending.


## 2026-09-26 Finance catalogue update
- Finance is now grouped in the Admin navigation as a dedicated Finance Portal, with separate Finance Dashboard, Fee Setup, Financial Intelligence and Finance Reports entries; existing routes remain available.
- The live fee catalogue now supports editable name, amount, category, mandatory/optional billing and active/inactive status.
- Confirmed clothing amounts were seeded as active mandatory fee items: Monday/Tuesday uniform pair ₦26,500; Wednesday wear ₦10,000; Friday wear ₦10,000.
- Confirmed club options were seeded as active optional fee items: Taekwondo ₦18,000; Red Cross ₦12,000; Cub Scout ₦18,000; Brownie ₦12,000. Optional clubs are selected per pupil and term, with one club selection replacing another for that pupil/term.
- A Textbook Fee item was created at ₦0 and is editable. It remains non-mandatory because the school previously confirmed current textbook sales had concluded.
- Term invoice generation was updated so mandatory active fees are included automatically, while optional fees are included only when explicitly selected for the pupil/term.
- No pupil club selections have been created yet; the live selection table is currently empty.
- Princess/admin finance access has NOT been changed. Mr Joseph should confirm whether Princess should receive full Admin Dashboard access or a restricted finance-focused role/permission set.
