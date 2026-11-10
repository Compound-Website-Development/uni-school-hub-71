"""Builds the five Imagemakers PDF guides. Run: python3 docs/guides-source/build_guides.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engine import *

LIMIT = ("<b>About the pictures in this guide.</b> The sign-in screens are real screenshots of the live system. "
 "Pages behind sign-in are explained with diagrams and plain steps, because the documentation team could not sign in "
 "to the school's live records from the test computer, and no real pupil or parent information may appear in a guide.")
BANDS = T([["Total score (CA + exam)","Remark shown"],["90 – 100","Outstanding"],["70 – 89","Excellent"],["60 – 69","Very Good"],["50 – 59","Good"],["40 – 49","Fair"],["0 – 39","Poor"]],[0.5,0.5])

# ---------------------------------------------------------------- ADMIN
def admin():
    s=[]
    s+=[H1("1. Introduction"),P("This guide is for the Proprietor and authorised members of school management. It explains how to run Imagemakers Nursery and Primary School through the Admin area, which the system calls the <b>Command Centre</b>."),
        P("The system has four main portals: Admin, Staff (teachers), Student (pupils) and Parent. Each person sees only the portal that matches their account."),
        *NOTE(LIMIT),
        H2("What the school does not use"),*B(["There is no boarding or hostel module in use. The school has no boarding facility.","Transport screens exist in the system, but the school no longer runs its own buses. Do not treat the bus pages as an active service.","Online card payment (Paystack) is <b>not live</b>. Fees are recorded manually by the bursar until the school's merchant account is registered and tested."])]
    s+=[H1("2. Signing in"),P("Go to the school's system address. The home address opens the sign-in page directly."),
        *IMG("login_desktop.png","Figure 2.1 — The sign-in page (real screenshot).",150),
        *STEPS(["Type your school email address and password.","Tap <b>Sign In</b>.","The system checks your role and opens the Admin Command Centre for administrator accounts.","If you forget your password, tap <b>Forgot password?</b> and follow the email link."]),
        H2("Viewing the other portals as an administrator"),
        P("In the sidebar, the <b>Open portals</b> section lets an administrator open the Staff, Student and Parent portals with the same account, so you do not need a second device."),
        *B(["<b>Staff portal:</b> if your admin account is not itself a teacher, the system lets you view the portal as the class teacher of the largest class.","<b>Student portal:</b> you see one pupil from that class. A notice reads “Admin preview identity” so nobody mistakes it for your own record.","<b>Parent portal:</b> if your account has no linked child, it shows that same pupil, as a parent would see them."]),
        *NOTE("Preview viewing is for checking and training only. Do not enter marks or attendance while previewing as another teacher — any record you save is still saved under your own admin account.","warn")]
    s+=[H1("3. The Admin layout"),P("On a computer, the navy sidebar on the left lists every admin page in sections. On a phone, tap the menu button at the top to open the same list. The sidebar remembers where you scrolled, so it does not jump back to the top when you open a page."),
        *T([["Area","What you find there"],["Dashboard","School-wide counts and shortcuts"],["People","Students, Staff, Manage Users, Bulk Upload / Register Import, ID Cards"],["Academics","Approvals, Reports, Progression (promotion history), CBT Studio, Oversight"],["Finance","Finance (invoices, receipts, debtors, discounts, audit trail), Fees catalogue, Financial Intelligence"],["Communication","Announcements, Communication templates, Policies, Documents, Complaints"],["Welfare & operations","Wellbeing, Behaviour, Predictive analytics, Library, Inventory, Visitors, Substitutions"],["Settings","School settings, activity log"]],[0.28,0.72])]
    s+=[H1("4. School roles"),
        *T([["Role","Portal","What they do"],["Proprietor / Super Admin","Admin","Everything, including adding other administrators"],["Other administrators","Admin","Sections set by their admin permission template"],["Class teacher","Staff","Their own class: attendance, marks, lesson notes, assignments, CBT"],["Pupil","Student","Own dashboard, results once published, homework, CBT"],["Parent / guardian","Parent","Linked children only: results, attendance, fees, receipts"]],[0.27,0.15,0.58]),
        *NOTE("<b>Principal and Bursar separation is not yet fully enforced.</b> Admin permission templates can hide menu sections, and fee changes are protected by a “manage fees” permission. However, any administrator can still read academic records, and money records are not hidden from every non-finance administrator at database level. Until this is completed, only give admin accounts to people trusted with both results and money.","warn")]
    s+=[H1("5. Managing pupils"),P("Open <b>Students</b> in the sidebar."),
        *STEPS(["Use the search box or class filter to find a pupil.","Tap <b>Add student</b> for a new pupil, or the edit button on a row to correct a record.","Fill in the name, class and admission number. Parent/guardian details are optional and can be added later.","Tap <b>Save</b>. The list refreshes and the pupil appears under their class."]),
        *B(["Admission numbers can be changed at any time. Imported pupils carry temporary numbers that begin with <b>PENDING-2026-</b> until the official register is entered.","Changing an admission number does not break the pupil's ID-card QR login, because the login is tied to the pupil record, not the number.","To confirm a save worked, refresh the page and search for the pupil again."]),
        H2("Bulk upload and register import"),P("Use <b>Bulk Upload</b> or <b>Register Import</b> to bring in many pupils from a spreadsheet. Download the template on that page, fill it in, and upload it. Check the preview before confirming."),
        *NOTE("Before importing, compare names against the existing list. Do not import the same register twice. If a duplicate is created, correct or deactivate one record by editing it; do not delete records that already have marks or invoices.","warn")]
    s+=[H1("6. Parents and child links"),P("A parent sees a child only when a link exists between the parent account and that pupil. Parents sign in on the <b>I am a Parent</b> screen using the Parent ID and access code printed on the back of the pupil's ID card."),
        *IMG("parent_access.png","Figure 6.1 — Parent Access screen (real screenshot).",62),
        *B(["Access codes now use a longer format (XXXX-XXXX-XXXX) and are created when ID cards are printed in <b>ID Cards</b>.","Two parents may use the same Parent ID.","If a parent says no child appears, check that the pupil has an ID card printed and that the parent used the codes from that card."])]
    s+=[H1("7. Staff, classes and subjects"),P("Open <b>Staff</b> to add or edit teachers and other staff. Open <b>Manage Users</b> to manage login accounts."),
        H2("The class-teacher model"),P("Imagemakers uses one class teacher per class. Each class has a class teacher set on the class record. When that teacher signs in, they see only the pupils in their class, and they can enter marks for every subject of that class."),
        *FLOW(["Teacher","Assigned class","Pupils in class","Subjects","Attendance, marks, report cards"],"Figure 7.1 — How a class teacher's work is organised."),
        H2("Specialist subjects"),P("French, Diction, Coding, Abacus, Creative Art and Yoruba are specialist subjects. A specialist teacher is linked to a class only where a class-subject link has been set. These subjects use letter grades A–E."),
        *NOTE("The school has not yet supplied the score boundaries for the A–E specialist grades, or whether they count towards the promotion average. The system does not yet have a separate A–E entry screen. Do not rely on specialist grades on the report card until this is finished.","warn")]
    s+=[H1("8. Sessions, terms and results"),P("The 2026/2027 session has three terms: <b>Wisdom</b>, <b>Excellent</b> and <b>Glorious</b>. Only one term is marked as current at a time; set it in <b>Settings</b>."),
        H2("How a score is calculated"),P("Teachers enter Continuous Assessment (shown as CA 40) and Examination (shown as Exam 60). The system adds them to give a total out of 100 and fills in the remark automatically."),
        BANDS[0],BANDS[1],
        *NOTE("The database still also stores an older A–F letter alongside each score. The school has approved descriptive remarks, not that A–F scheme, so treat the remark as the official result. Removing the A–F letter is on the developer's list.","warn"),
        H2("Approving and publishing"),*STEPS(["Teachers submit marks for approval from the Gradebook.","Open <b>Approvals</b> to review submitted marks.","Report cards are prepared from the Report Card page and become visible to pupils and parents only when published.","Check publication by viewing the pupil in the Student portal preview."]),
        *NOTE("Unpublished results do not appear for pupils or parents. If a parent reports a missing result, first check whether it has been published.")]
    s+=[H1("9. Promotion, repetition and demotion"),P("Open <b>Progression</b>. Choose the pupil, the decision (promoted, repeated or demoted), the new class, the session and the date, then save."),
        *B(["The system changes the pupil's class and writes the history record in one step, so the two cannot disagree.","A repeated pupil must stay in the same class; a promoted pupil must move to a different class. The system refuses other combinations.","Only administrators can record a decision.","A 50% average is the qualification threshold. The system does <b>not</b> promote anyone automatically — the school records each final decision."]),
        *NOTE("Pupils can read their own progression history. Parents cannot yet read it, and no message is sent to the pupil or parent when the class changes. Inform families directly for now.","warn"),
        H2("Historical report cards"),P("Results are stored per term and session, so earlier terms remain in the system after a pupil is promoted. A pupil-facing selector for older sessions has not been fully checked; confirm with the developer before telling parents they can browse past years themselves.")]
    s+=[H1("10. Fees and the fee catalogue"),P("Open <b>Fees</b> to manage the fee catalogue. Each fee item has a name, amount, category, whether it is <b>mandatory</b> or <b>optional</b>, and optionally a class and term."),
        *T([["Item (school reference prices)","Amount","Billing"],["Monday/Tuesday uniform pair","₦26,500","Optional, per pupil and term"],["Wednesday wear","₦10,000","Optional"],["Friday wear","₦10,000","Optional"],["Taekwondo","₦18,000","Club — billing rule to be confirmed"],["Red Cross","₦12,000","Club — billing rule to be confirmed"],["Cub Scout","₦18,000","Club — billing rule to be confirmed"],["Brownie","₦12,000","Club — billing rule to be confirmed"]],[0.5,0.18,0.32]),
        *B(["Mandatory items are added to every invoice for the class and term they apply to.","Optional items (uniforms, clubs) are added only for pupils for whom the item has been selected.","Textbooks and 40/60/80-leaf notebooks must be bought through the school office. Their titles and prices have not yet been supplied, so they are not in the catalogue. Add them as fee items once the school provides the list.","Do not record the same book both as an invoice line and as a separate office sale — that would charge the parent twice.","There is no fixed due date, because the school accepts instalments."])]
    s+=[H1("11. Invoices, payments and receipts"),
        *FLOW(["Fee catalogue","Generate term invoices","Parent pays at school","Bursar records payment","Receipt issued, balance updates"],"Figure 11.1 — The current manual fee flow."),
        H2("Generating invoices"),*STEPS(["Open <b>Finance</b> → <b>Invoices</b>.","Choose the term (and a class, or all classes).","Tap <b>Generate</b>. One invoice is created per active pupil who has a class."]),
        P("Running generation again for the same term does <b>not</b> create a second invoice. It refreshes the fee lines on the existing invoice from the current catalogue. Discounts and payments are kept."),
        H2("Recording a payment"),*STEPS(["Find the invoice and tap <b>Record payment</b>.","Enter the amount, method (cash, transfer, POS) and reference.","Save. A numbered receipt is created and the balance updates.","Print the receipt; it carries the school crest."]),
        P("Part payments are allowed. The payment is applied to invoice lines in priority order, and the invoice shows the remaining balance."),
        H2("Discounts, debtors and audit"),*B(["<b>Discounts</b>: apply a fixed or percentage discount with a reason.","<b>Debtors</b>: lists invoices with an outstanding balance for the chosen term.","<b>Audit trail</b>: every financial change is logged and cannot be edited or deleted."])]
    s+=[H1("12. Staff attendance and oversight"),P("Open <b>Oversight</b>. It has four tabs: Teacher clock-ins, Timetable, Lesson notes and CBT exams."),
        *B(["Teachers clock in from the Staff portal on their phone. A clock-in after <b>7:30 a.m.</b> is marked late. No grace period is configured.","The phone's location is checked against a 400-metre radius around the school. This radius has <b>not yet been approved</b> by management.","Timetables can be viewed here. A screen for teachers to build their own timetable does not exist yet, so the timetable may be empty.","Lesson notes submitted by teachers can be viewed. A formal approve/return step is not built yet.","A live “class has started” signal is not built yet."])]
    s+=[H1("13. CBT, announcements and the Wall"),
        H2("CBT exams"),P("Open <b>CBT Studio</b> to create exams and questions inside the Admin area. A pupil can see an exam only when it is set to active. Answer keys are not sent to pupils; the score is worked out on the server when the pupil submits."),
        *NOTE("The offline Windows CBT application has been planned and specified but has not been built. Do not promise it to staff yet.","warn"),
        H2("Announcements"),P("Open <b>Announcements</b>, write the title and message, choose the audience (everyone, staff, students or parents) and publish. Only published announcements are shown."),
        H2("Community Wall"),P("Staff, pupils and parents can post and comment on the Wall. Administrators should check it regularly. The browser does not yet ask for notification permission, so people only see new posts when they open the system.")]
    s+=[H1("14. Documents, analytics and AI tools"),*B(["<b>Documents</b> collects report cards, invoices, receipts and exports in one place.","<b>Analytics</b> and <b>Reports</b> read live school records. Because grades, attendance and timetables are still empty for this session, many charts will show zero until teachers begin entering data.","<b>Predictive analytics</b> and <b>Wellbeing</b> depend on marks, attendance and behaviour records. Treat their suggestions as prompts for a conversation, never as a decision about a child.","The <b>AI helper</b> works only for signed-in users. It is set to guide pupils rather than do their homework. It does not yet read uploaded pictures."])]
    s+=[H1("15. Common problems"),*T([["Problem","What to do"],["A parent sees no child","Check that the ID card has been printed and the parent used that card's Parent ID and code"],["A pupil sees no results","Check that results for that term have been published"],["A teacher sees no pupils","Check that the teacher is set as class teacher on the class record"],["An invoice looks wrong","Correct the fee item, then run Generate again for that term — payments and discounts are kept"],["The wrong class after promotion","Record a new progression decision; the history keeps both entries"],["Page shows “Something went wrong”","Tap Try again; if it repeats, note the page and time and tell the developer"]],[0.36,0.64])]
    s+=[H1("16. Safe administration"),*B(["Never share passwords or parent access codes on WhatsApp groups.","Give admin access only to people who need it, and remove it when they leave.","Do not delete pupils who have marks, invoices or receipts — change their status instead.","Print ID cards only from the ID Cards page so codes are generated properly.","Report any suspicious login or unexpected change to the Proprietor immediately."])]
    s+=[H1("17. Frequently asked questions"),*[x for q,a in [
        ("Can parents pay online?","Not yet. Online payment needs the school's own Paystack account registered with its CAC documents, then testing. Until then the bursar records payments manually."),
        ("Will the system promote pupils automatically at 50%?","No. 50% is the qualification threshold. The school records every decision."),
        ("Can we change an admission number later?","Yes, at any time, from the Students page."),
        ("Is there a hostel or bus module?","Not in use. The school has no boarding, and transport is outsourced."),
        ("Can a Bursar be blocked from seeing results?","Not fully yet. See section 4.")] for x in (H2(q),P(a))]]
    build(os.path.join(ROOT,"public/guides/Imagemakers-Super-Admin-Guide-2026.pdf"),"Super Admin &\nManagement Guide","For the Proprietor and authorised school management",s)

# ---------------------------------------------------------------- TEACHER
def teacher():
    s=[]
    s+=[H1("1. Welcome"),P("This guide shows class teachers how to use the Staff portal. It is written for phones, but everything also works on a computer."),*NOTE(LIMIT)]
    s+=[H1("2. Signing in"),*IMG("login_mobile.png","Figure 2.1 — Sign-in on a phone (real screenshot).",62),
        *STEPS(["Open the school system address.","Enter the school email and password given to you by the office.","Tap <b>Sign In</b>. The Staff portal opens.","Never share your password. If you forget it, tap <b>Forgot password?</b>"])]
    s+=[H1("3. What you can and cannot see"),
        *FLOW(["You","Your assigned class","Your pupils","All class subjects","Attendance, marks, notes"],"Figure 3.1 — Your work is organised around your class."),
        *T([["You can","You cannot"],["See the pupils in your own class","See other classes' pupils"],["Mark your class's attendance","Change fees or invoices"],["Enter CA and exam marks for every subject of your class","Publish results without approval"],["Write lesson notes, assignments and CBT tests for your class","Edit school settings or staff records"]],[0.5,0.5]),
        P("If you see no pupils, your account has not yet been set as the class teacher of a class. Ask the school office.")]
    s+=[H1("4. My Class and attendance"),P("Open <b>Classes</b> (My Class). You will see your class, its pupils and buttons for <b>Mark attendance</b>, <b>Enter results</b> and <b>Report cards</b>."),
        *STEPS(["Tap <b>Mark attendance</b>. Today's date is selected.","Mark each pupil present, absent or late.","Tap <b>Save</b>.","Reopen the page to confirm your marks were kept."]),
        H2("Clocking in"),P("Clock in from the Staff dashboard when you arrive. A clock-in after <b>7:30 a.m.</b> is marked late. Your phone must allow location so the system can confirm you are at school.")]
    s+=[H1("5. Entering marks"),*STEPS(["Open <b>Gradebook</b>. Your class is already chosen.","Choose the subject and the term.","Type the CA mark in the <b>CA (40)</b> column and the exam mark in the <b>Exam (60)</b> column.","The total and remark fill in automatically.","Tap <b>Save</b>, then <b>Submit for approval</b> when the subject is complete."]),
        BANDS[0],BANDS[1],
        *NOTE("Please wait for the school to confirm whether CA is entered out of 40 and exam out of 60 (as the screen shows) before entering a whole term. Specialist A–E grades (French, Diction, Coding, Abacus, Creative Art, Yoruba) do not yet have their own entry screen.","warn"),
        H2("Correcting a mistake"),P("Before approval you can change a mark and save again. After approval, ask the school office to reopen it.")]
    s+=[H1("6. Lesson notes, assignments and CBT"),*B(["<b>Lesson plans</b>: write the topic, objectives, activities and resources. Your class is filled in for you. The office can view your notes; a formal approve/return step is not built yet.","<b>Assignments</b>: create homework for your class with a due date. Pupils see it under Homework.","<b>CBT</b>: create an online test, add multiple-choice questions and set it to active when pupils should take it. Pupils never see the correct answers."]),
        *NOTE("Timetable: there is no screen yet for teachers to build their own timetable. If your timetable is empty, that is expected for now.")]
    s+=[H1("7. Announcements, Wall and AI helper"),*B(["Announcements from the school appear on your dashboard.","The Wall is a shared space for staff, pupils and parents. Keep posts professional.","The AI helper can suggest wording, such as report comments. Always read and edit what it writes. Do not paste private pupil information into it."])]
    s+=[H1("8. Common problems and questions"),*T([["Problem","What to do"],["No pupils showing","Ask the office to set you as class teacher of your class"],["Marks did not save","Check your internet, then save again and reopen the page"],["Clock-in refused","Allow location on your phone and make sure you are on school grounds"],["Pupil missing from my class","Ask the office to correct the pupil's class"]],[0.36,0.64]),
        H2("Can I see other classes?"),P("No. You only see your own class, unless the office also links you to a specialist subject in another class."),
        H2("Can I publish report cards?"),P("No. You prepare and submit; the school publishes.")]
    build(os.path.join(ROOT,"public/guides/Imagemakers-Teacher-Guide-2026.pdf"),"Teacher Guide","For class teachers and authorised teaching staff",s)

# ---------------------------------------------------------------- STUDENT
def student():
    s=[]
    s+=[H1("1. Hello!"),P("This is your school app. It shows your timetable, homework, tests and school results. A grown-up at home can help you use it."),
        *B(["Never tell anyone your password.","Never share your ID card codes.","If something looks wrong, tell your teacher or your parent."])]
    s+=[H1("2. How to get in"),*IMG("login_mobile.png","Picture 2.1 — The sign-in page.",60),
        H2("Way 1: Scan your ID card"),*STEPS(["Tap <b>Scan an ID card</b>.","Hold your school ID card up to the camera.","Your page opens with your name at the top."]),
        H2("Way 2: Email and password"),P("If the school gave you an email and password, type them in and tap <b>Sign In</b>.")]
    s+=[H1("3. Your home page"),P("At the top you will see your name and class. Below that you will see your next lesson, your attendance and quick buttons."),
        *FLOW(["Home","Homework","Tests (CBT)","Results","Wall"],"Picture 3.1 — The buttons at the bottom of your screen."),
        *NOTE("If your timetable, homework or results are empty, do not worry. Your teacher may not have added them yet.")]
    s+=[H1("4. Results and report cards"),P("Tap <b>Results</b> or <b>Report card</b>. Your report card shows each subject, your score and a remark such as Good, Very Good or Excellent."),
        *NOTE("Your results only appear after the school has finished checking and publishing them. If you see nothing, ask your parent to wait or speak to your teacher.")]
    s+=[H1("5. Homework and tests"),*B(["<b>Homework</b>: see what your teacher set and when it is due. Write your answer and tap Submit.","<b>Tests</b>: a test appears only when your teacher opens it.","Read each question. Tap your answer. You can change it before you finish.","Watch the timer. When you are done, tap <b>Submit</b>. You can only submit once."])]
    s+=[H1("6. The learning helper"),P("The helper can explain words and give hints. It will <b>not</b> do your homework or your test for you — that is your job, and you can do it!"),
        *B(["Ask: “What does this word mean?”","Ask: “Can you give me a hint?”","Do not type your address, phone number or password."])]
    s+=[H1("7. If something goes wrong"),*T([["What happened","What to do"],["The page says “Something went wrong”","Tap Try again"],["I cannot see my results","They may not be published yet"],["My test is not there","Your teacher has not opened it yet"],["I am sent back to sign in","Scan your ID card again or ask a grown-up"]],[0.5,0.5])]
    build(os.path.join(ROOT,"public/guides/Imagemakers-Student-Guide-2026.pdf"),"My School App","A friendly guide for pupils",s)

# ---------------------------------------------------------------- PARENT
def parent():
    s=[]
    s+=[H1("1. Introduction"),P("The Parent portal lets you follow your child's progress: report cards, attendance, fees and receipts, and school announcements."),*NOTE(LIMIT)]
    s+=[H1("2. Signing in"),*IMG("parent_access.png","Figure 2.1 — Parent Access screen (real screenshot).",62),
        *STEPS(["On the sign-in page, tap <b>I am a Parent</b>.","Enter the <b>Parent ID</b> (starts with IMS-P-) printed on the back of your child's ID card.","Enter the <b>Access code</b> (XXXX-XXXX-XXXX) from the same card.","Tap <b>Open parent dashboard</b>."]),
        P("Two parents may use the same Parent ID. Keep the card's codes private, as anyone with them can view your child's records.")]
    s+=[H1("3. Your dashboard and children"),P("Your dashboard shows each child linked to your account. If you have more than one child at the school, choose the child at the top of the fees, results or attendance page."),
        *NOTE("<b>No child showing?</b> Your account has not been linked to your child yet. Contact the school office with your child's name and class.","warn")]
    s+=[H1("4. Results, attendance and timetable"),*B(["<b>Results</b> show each subject's total and the school's remark (Poor, Fair, Good, Very Good, Excellent, Outstanding).","Results appear only after the school publishes them for that term.","<b>Attendance</b> shows the most recent days marked by the class teacher.","The class timetable will show once the school has entered it."]),BANDS[0],BANDS[1]]
    s+=[H1("5. Fees, payments and receipts"),
        *T([["Word","What it means in the system"],["Invoice","The bill for one term, listing each item (mandatory items plus any optional items chosen for your child)"],["Payment","Money the school has received and recorded against the invoice"],["Receipt","A numbered document issued for each recorded payment"],["Balance","Invoice total, minus discounts, minus payments"]],[0.22,0.78]),
        *B(["You may pay in instalments; there is no fixed due date. Each part payment reduces the balance.","Uniforms and clubs are optional and appear only when chosen for your child.","Textbooks and notebooks are bought through the school office.","Online card payment is <b>not available yet</b>. Pay at the school or by the method the bursar gives you, then check that the receipt appears in your portal."])]
    s+=[H1("6. Announcements, Wall and notifications"),P("School announcements appear on your dashboard. The Wall lets parents, staff and pupils share news; please be respectful. The app does not yet send phone notifications, so open it regularly.")]
    s+=[H1("7. Wrong information and questions"),P("If your child's name, class or any detail is wrong, tell the school office. Only the school can correct records."),
        *[x for q,a in [("Why can't I see this term's report card?","It has not been published yet."),("I paid but the balance has not changed.","The bursar must record the payment. Bring your proof of payment to the office."),("Can I pay online?","Not yet. The school will announce when this is ready."),("Can I see older report cards?","Results are kept for every term. Ask the office if you need an older report while the history view is being completed.")] for x in (H2(q),P(a))]]
    build(os.path.join(ROOT,"public/guides/Imagemakers-Parent-Guide-2026.pdf"),"Parent & Guardian Guide","For parents and guardians of Imagemakers pupils",s)

# ---------------------------------------------------------------- DEVELOPER
def developer():
    s=[]
    s+=[H1("1. Read this first"),P("This internal guide is for the system developer. It assumes you build with AI tools rather than writing code by hand, so each item says what it is, where it lives, and what to ask for next."),
        *NOTE("INTERNAL. Do not publish, link or share with the school. It contains no passwords, keys or personal data — keep it that way.","warn"),
        P("Evidence: source code read on 10 Nov 2026, database functions and policies read live, sign-in pages screenshotted. The test browser could not sign in to this backend (it is a user-managed Supabase project), so no signed-in page was exercised end to end.")]
    s+=[H1("2. How the system is built"),*T([["Layer","What it is","Where"],["Screens","React + Vite + Tailwind web app","src/pages/{admin,staff,student,parent}"],["Layouts","Portal shells and navigation","src/components/layout/*Layout.tsx"],["Sign-in & roles","Supabase Auth + user_roles table","src/hooks/useAuth.tsx, ProtectedRoute"],["Database","Supabase Postgres with row-level security","supabase/migrations"],["Server code","Edge functions","supabase/functions"],["School rules","Shared constants (clock-in, weights, specialist subjects)","src/lib/schoolConfig.ts"]],[0.18,0.42,0.40])]
    s+=[H1("3. Routes by portal"),*T([["Portal","Routes"],["Public","/login, /parent-access, /apply, /s/:token (QR), /p/:token, /verify, /reset-password"],["Admin","/admin, students, staff, users, bulk-upload, register-import, id-cards, approvals, reports, progression, cbt, oversight, finance, fees, financial, announcements, communication, policies, documents, analytics, predictive, wellbeing, behavioral, library, inventory, visitors, substitutions, complaints, settings, activity, transport, certificates"],["Staff","/staff, classes, attendance, gradebook, report-card, reports, cbt, assignments, lesson-plans, students, admissions, messages, forum, leave, wall, profile"],["Student","/student, grades, reports, report-card, transcript, schedule, attendance, fees, announcements, exams, exams/:id, homework, learning, library, calendar, complaints, resources, wall, profile, settings"],["Parent","/parent, grades, attendance, fees, messages, forum, wall, profile, transport"]],[0.14,0.86])]
    s+=[H1("4. Sign-in and roles"),*B(["Roles live in <b>user_roles</b> (student, teacher, admin, parent, driver). Users cannot change their own role.","Pupils: QR scan calls the <b>qr-student-login</b> function, which creates the pupil's login on first scan and links students.user_id.","Parents: <b>parent-login</b> function checks Parent ID + access code.","Admin preview: useAuth gives an admin without own records a real class teacher (largest class) and a pupil from that class; parent pages fall back to that pupil (src/lib/adminPreview.ts). Choice is stored in the browser as im_preview_teacher_id / im_preview_student_id. Read-only display; writes still run as the admin.","Key database helpers: has_role, is_staff, is_super_admin, has_admin_permission, can_manage_student, can_view_student, teaches_class."])]
    s+=[H1("5. Data and security rules"),*T([["Area","Tables","Who can read / write (live policy)"],["Pupils & results","students, grades, term_results","Read: can_view_student (staff for the pupil, the pupil, linked parent). Write: can_manage_student"],["Finance","invoices, invoice_lines, receipts, receipt_allocations","Read: can_view_student. Write: has_admin_permission(can_manage_fees). Allocations written only by trigger"],["Audit","finance_audit","Insert/read only; update and delete denied"],["Progression","student_progression_history","Admin manage; pupil reads own. Parents: no policy"],["Timetable","schedules","All signed-in read; staff write"],["Lesson notes","lesson_plans","Staff read/write"],["Staff clock-in","staff_attendance","Staff read; own insert/update or admin"],["CBT","exams, exam_questions, exam_submissions","Questions staff-only; pupils use student_exam_questions (no answer key) and submit_exam (server scoring)"],["Admin permissions","admin_permissions, admin_role_templates","Super admin manages"]],[0.17,0.33,0.50])]
    s+=[H1("6. Key flows"),
        H2("Grades"),P("Trigger <b>compute_grade_fields</b> sets total = CA + exam, then remark (90+ Outstanding, 70+ Excellent, 60+ Very Good, 50+ Good, 40+ Fair, else Poor) — matches school bands. It ALSO sets letter_grade A–F (90/80/70/60/50) which the school has not approved."),
        H2("Invoices"),P("<b>generate_term_invoices(term, class, due)</b>: requires can_manage_fees; one invoice per active pupil per term (no duplicates); deletes and re-inserts only lines of kind 'fee' from active catalogue items. Optional items are expected to come from student_fee_selections. <b>record_manual_payment</b> creates a receipt; trigger allocate_receipt_waterfall spreads it over lines by priority; recalc_invoice updates totals."),
        H2("Progression"),P("<b>record_student_progression</b>: admin only, locks the pupil row, validates decision/class rules, updates class and inserts history in one transaction (atomic).")]
    s+=[H1("7. Implementation status")]
    rows=[["Feature","Status","Frontend","Backend","Tests","Confidence","Remaining work"],
     ["Role sign-in & portals","Implemented, unverified","useAuth, layouts","user_roles, has_role","None","Medium","Signed-in click-through per role"],
     ["Admin preview identity","Implemented, unverified","useAuth, adminPreview.ts","Uses existing staff read access","None","Medium","Add a picker to choose teacher/pupil"],
     ["QR pupil login","Implemented, verified","StudentPortalEntry","qr-student-login","Manual call OK","High","Reprint old ID cards"],
     ["Class-teacher scoping","Implemented, unverified","StaffClasses, useAssignedClass","classes.class_teacher_id","None","Medium","Test with a teacher login"],
     ["40/60 marks + remarks","Implemented, unverified","StaffGradebook","compute_grade_fields","None","Medium","Remove A–F letter; confirm entry maxima"],
     ["Specialist A–E grades","Not implemented","Config only","None","None","High","Entry screen, report-card row, boundaries from school"],
     ["Result publishing","Partially implemented","reportCards.ts","term_results.is_published","None","Low","Confirm pupil/parent views filter unpublished"],
     ["Historical reports","Partially implemented","StudentReportCard","Data kept per term","None","Low","Session/term selector for pupil and parent"],
     ["Progression","Implemented, unverified","AdminProgressionPage","record_student_progression","None","Medium","Parent read policy; notifications"],
     ["Fee catalogue mandatory/optional","Implemented, unverified","AdminFeesPage","fee_items, student_fee_selections","None","Medium","Verify optional-only billing"],
     ["Textbooks / notebooks","Not implemented","—","—","None","High","Needs school price list"],
     ["Invoices & re-generation","Implemented, unverified","AdminFinancePage","generate_term_invoices","None","Medium","Test re-run keeps discounts"],
     ["Manual payments & receipts","Implemented, unverified","Finance, ReceiptDocument","record_manual_payment","None","Medium","Duplicate-reference guard"],
     ["Paystack","Not implemented","—","—","None","High","Merchant account, init + webhook functions"],
     ["Principal/Bursar separation","Partially implemented","Menu hiding","Only fees gated","None","High","Policy changes per permission"],
     ["Staff clock-in","Implemented, unverified","Staff dashboard, Oversight","staff_attendance","None","Medium","Radius approval"],
     ["Teacher timetable editing","Not implemented","View only","Staff may write","None","High","Editor screen"],
     ["Lesson-start signal","Not implemented","—","—","None","High","Build"],
     ["Lesson-note approval","Not implemented","View only","status column","None","Medium","Approve/return actions"],
     ["Online CBT","Implemented, unverified","StaffCBT, TakeExam","student_exam_questions, submit_exam","None","Medium","Timed end-to-end test"],
     ["Offline Windows CBT","Not implemented","Spec docs only","—","None","High","Build per docs/CBT_DESKTOP_*"],
     ["AI helper","Implemented, unverified","AIChatWidget","ai-assistant (JWT required)","401 check OK","Medium","Image input; moderation tests"],
     ["Notifications permission","Not implemented","No permission request","notifications table","None","High","Request + push"],
     ["Wall & announcements","Implemented, unverified","Wall pages","wall_*, announcements","None","Medium","Post/read test per role"],
     ["Analytics / predictive","Implemented, unverified","Admin analytics pages","Live tables","None","Low","Recheck once real data exists"]]
    s+=T(rows,[0.17,0.13,0.15,0.16,0.08,0.09,0.22])
    s+=[H1("8. Gaps and acceptance tests"),*T([["Gap","Confirmed","Work required","Acceptance test"],
     ["Admin permission flags","Only fees enforced in database","Add has_admin_permission checks to grades, students, staff policies","Bursar account cannot read grades via the app"],
     ["Parent progression read","No parent policy","Add SELECT policy using parent_student_links","Linked parent sees history; unlinked does not"],
     ["Class-change notification","None","Insert notifications in record_student_progression","Pupil and parent receive notice"],
     ["A–F letter grade","Trigger still sets it","Stop writing/displaying letter_grade for core subjects","Report card shows remark only"],
     ["Optional fees","Depends on selections join","Verify the function filters non-mandatory by selection","Unselected uniform absent from invoice"],
     ["Invoice re-run","Only kind='fee' lines replaced","Confirm discount lines survive","Re-run keeps discount and payments"],
     ["Payment idempotency","No reference uniqueness seen","Unique (method, reference) guard","Same reference twice is refused"],
     ["Paystack","No code","Init + verify + webhook functions","Test payment produces one receipt"],
     ["Unpublished results","Not confirmed in views","Filter is_published in pupil/parent queries","Draft result invisible to parent"],
     ["Notifications","No permission prompt","Request on dashboard, add push","Prompt appears once on phone"]],[0.18,0.22,0.32,0.28])]
    s+=[H1("9. Contradictions with older documents"),*B(["FUNCTIONAL_SPEC.md describes A–F as official; the school approved descriptive remarks.","Older notes mention a 7:45 a.m. cutoff; config and school decision now say 7:30.","Older notes treat 400 m as policy; it is unconfirmed.","Transport and driver features exist but school transport is outsourced."]),
        H1("10. Information still needed from the school"),*B(["Textbook titles, classes, quantities and prices; 40/60/80-leaf notebook prices.","Whether clubs are compulsory and whether one club per pupil.","Specialist A–E boundaries, entry method and whether they count to the 50% average.","Whether 50% is per term or per session.","Approval of the 400 m radius and any grace period.","Official admission numbers for all pupils.","Paystack registration under the school's CAC with the bursar as contact."]),
        H1("11. Do not yet describe as finished"),*B(["Online payments","Principal/Bursar separation","Specialist A–E grading","Teacher timetable builder and lesson-start signal","Lesson-note approval","Phone notifications","Offline Windows CBT","AI image reading","Parent view of promotion history and older report cards"]),
        H1("12. Rebuilding these guides"),P("Edit docs/guides-source/build_guides.py and run: python3 docs/guides-source/build_guides.py. Screenshots live in docs/guides-source/screenshots.")]
    build(os.path.join(ROOT,"docs/internal/Imagemakers-Developer-Guide-2026.pdf"),"Internal Developer Guide","Confidential — for the system developer only",s)

if __name__=="__main__":
    for f in (admin,teacher,student,parent,developer): f(); print("built",f.__name__)
