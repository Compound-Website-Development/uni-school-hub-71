# Student Portal — Editorial Rebuild (the inverse approach)

Instead of the usual gradient-hero, glassy, rounded-tile mobile app skin, go the other way: a flat, high-contrast, typography-led interface. One deep sky-blue ink on near-white paper, one gold accent used sparingly, crisp hairline rules instead of drop shadows, near-square corners, and generous whitespace. Calm and confident rather than colourful and busy — the data itself is the decoration. Same routes, tables and role guards; desktop keeps the sidebar.

## 1. Shell (quiet, structural)

- **Bottom nav (persistent):** Home / Grades / Reports / Schedule / Profile — opaque bar with a hairline top rule, active state marked by a thin top bar over the icon and ink-strength change (no pills, no blur, no glow), safe-area padding. Drawer opens from the header.
- **Nav drawer (Sheet):** all modules as a plain, alphabetically grouped text list with small monochrome icons and section labels — Dashboard, Grades, Attendance, Report Cards, Transcript, Fees, Announcements, CBT Exams, Homework, Library, Calendar, Complaints, Resources, Schedule, Profile, Wall, Settings. No coloured tiles.
- **Header:** static (not floating), oversized page title in the display face, small avatar and bell aligned to the baseline, back-arrow variant on detail pages.
- **Motion:** restrained — content fades up once on mount, active states snap, press feedback is a subtle scale. No staggered showpiece animation. AI chat FAB stays clear of the nav bar.

## 2. Screens

**Dashboard** — no hero image or gradient: a large typographic greeting, then the numbers that matter set as big figures with small captions (attendance %, class position, average, subjects) separated by hairline rules. Latest results as a vertical ranked list, not a carousel. A single plain text-link list for modules instead of a coloured tile grid, and a compact "next up" line for today's class and nearest event.

**Grades** — a dense, table-like ledger per term: subject, CA, exam, total, grade — right-aligned figures, monospaced numerals, grade shown as a letter in ink weight rather than a coloured badge. Term switcher as an underlined tab row.

**Attendance & Schedule** — a bar strip of the term's days (present/absent/late as tick marks) rather than a calendar grid or ring, a single headline percentage, and the day's timetable as a plain time-column list with the next class marked by a rule and label.

**Homework** (reference image 6) — search field and Pending / Submitted as underlined tabs; each assignment is a rule-separated row: subject in small caps, title in large type, due date, and status as a plain word (Due soon / Overdue / Pending) with overdue the only thing allowed to go red. Actions are text links, with one solid primary button per row.

**Lesson Notes list** (image 7) — search, subject filter chips, "Recent Notes" cards with subject pill, title, excerpt, date and Read action, bookmark toggle. This becomes the Learning Hub / Resources listing.

**Lesson detail** (image 8) — subject pill, title, author + date, then stacked cards: Summary, Objectives (check-list), Resources (file / external link rows), optional Key Formula block; download FAB.

**Communications** (image 9) — Announcements / My Feedback tabs, cards with coloured left rail, category pill (Urgent / Policy Update / Broadcast), timestamp, excerpt, attachment chip, "Read full details"; FAB to compose feedback.

**Feedback / Complaints** (image 10) — subject select, category chips (Complaint / Suggestion / Inquiry), message textarea, attachment upload zone, "Submit anonymously" toggle, full-width submit button. Writes to `complaints`.

**Report Cards / Transcript / Fees / Library / CBT / Calendar / Profile** — same data, restyled to the new card language: section headers, coloured status pills, empty states with illustration-style icons.

## Technical notes

- No schema changes. All existing queries and tables stay (`grades`, `term_results`, `attendance`, `schedules`, `assignments`/`assignment_submissions`, `academic_resources`, `announcements`, `complaints`, `fee_items`/`fee_payments`, `library_books`/`book_issues`, `exams`, `school_events`, `students`).
- The anonymous-submission toggle and file attachment on feedback are UI-only unless you want columns added later — anonymous will simply omit the visible name in the student's own view; say the word and I'll add real backend support.
- Bookmarks on lesson notes will be stored locally (localStorage) since there is no bookmarks table.
- Rework `StudentLayout`, `BottomNavigation`, and the student pages listed; add shared mobile primitives (SectionHeader, StatCard, StatusPill, SegmentedTabs, EmptyState) under `src/components/student/`.
- Colour/shadow/radius tokens extended in `index.css` + `tailwind.config.ts`; no hardcoded colours in components.
