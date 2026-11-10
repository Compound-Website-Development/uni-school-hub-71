# Imagemakers SMS — Completion and Acceptance Plan
Updated: 10 November 2026

This is the implementation and acceptance checklist for the existing repository. A feature is verified only after its database workflow and role restrictions pass tests; a visible screen alone is not proof. The latest school decisions are also recorded in [IMAGEMAKERS_SCHOOL_DECISIONS_2026-11-10.md](./IMAGEMAKERS_SCHOOL_DECISIONS_2026-11-10.md).

## Confirmed school decisions

- CA/exam weighting is 40%/60%. The current gradebook presents CA out of 40 and Exam out of 60; confirm this is the intended mark-entry method at staff training.
- Descriptive bands confirmed by Mr Joseph: 0–39 Poor; 40–49 Fair; 50–59 Good; 60–69 Very Good; 70–89 Excellent; 90–100 Outstanding.
- Specialist subjects French, Diction, Coding, Abacus, Creative Art and Yoruba use A–E grades. Numeric boundaries and the data-entry method are still unknown. Do not invent them.
- Promotion qualification threshold is **50% average**, confirmed 9 November 2026. The system records the school's decision; it must not automatically promote a pupil.
- Staff clock-in time is **07:30**, confirmed 9 November 2026. The existing 400-metre radius remains unconfirmed. Do not add an unapproved grace period.
- Parents must buy textbooks and notebooks from the school office. Required class-by-class titles, quantities and prices are still outstanding.
- Uniform purchases remain optional by pupil and term. Keep the existing approved amounts.
- Preserve existing club options and prices. Confirm the exact mandatory/optional club-selection rule before changing it.
- Tuition, textbook and notebook prices must not be invented. No fixed fee due date has been approved; instalments are accepted.
- No boarding/hostel module is required. The school no longer operates its own bus service; do not reintroduce a school-owned bus workflow.

## Academic management

- [x] Bulk pupil upload renders inside the Admin layout.
- [x] CSV import improvements include quoted-field parsing, admission-number input and duplicate/class-mapping checks. Full end-to-end acceptance remains pending.
- [ ] Downloadable pupil and staff spreadsheet templates with clear column instructions.
- [ ] Duplicate warnings against existing records, safe per-row recovery and incomplete-record indicators verified against live data.
- [ ] Admin editing for pupils, parents/guardians, teachers, staff, classes, arms and subjects, with validation and audit history.
- [ ] Class/arm/subject/teacher allocations, including specialist-subject ownership and workload checks.
- [ ] Confirm specialist A–E entry method, approved score boundaries if numeric, and contribution to the pupil's overall average.
- [ ] CA/exam entry, 40/60 calculation, score-range validation, missing-mark checks and school-approved remarks tested.
- [ ] Result approval and publication workflow verified for each authorised role.
- [ ] Historical report cards selectable by academic session and term in both pupil and linked-parent portals.
- [x] Admin progression workflow and migration file are present in the merged codebase.
- [ ] Verify the live Supabase progression table/RPC and RLS; the management connection timed out during the 10 November check.
- [ ] Add parent access to progression history through linked-child authorisation; the current migration's own-pupil policy does not by itself establish parent access.
- [ ] After an authorised class change, notify the pupil and linked parent/guardian of the new class and session through the approved in-app/announcement channel; do not reveal another pupil's records.
- [ ] Verify progression history retains previous class, new class, session, decision, date, approver and reason; test promote/repeat/demote and prevent invalid class moves.
- [ ] Keep 50% as qualification guidance only. Final decision remains authorised school staff's responsibility.

## Finance, inventory and receipts

- [x] Keep the existing Finance Dashboard; do not create a duplicate.
- [x] Printable receipt includes school branding and payment details.
- [x] Fee catalogue supports categories, mandatory/optional status, class/term targeting and basic editing.
- [x] Optional fee selection groundwork exists for individual pupils and terms; existing uniform items were changed to optional without changing their amounts.
- [ ] Build structured textbook catalogue by class, subject/title, edition and quantity, with an editable school-approved price.
- [ ] Add notebook options for 40-leaf, 60-leaf and 80-leaf books, with per-item prices and school-approved quantities.
- [ ] Configure textbooks and notebooks as required school-office purchases once titles, quantities and prices are supplied. Prevent duplicate billing between invoices and office sales.
- [ ] Preserve optional uniform purchase selection per pupil/term; no automatic repeat charge.
- [ ] Confirm whether each pupil must choose exactly one club and then configure each club's mandatory/optional status accordingly.
- [ ] Expand catalogue for larger fee lists and class/arm/session/term applicability, quantities, discounts and one-off charges.
- [ ] Build bursar spreadsheet-style payment/fee grid with keyboard navigation, copy/paste, safe CSV/XLSX import/export, visible validation and audit history. Do not claim to reproduce all Excel features.
- [ ] Verify repeat-safe invoice generation; it must not overwrite receipts, payments or authorised manual adjustments.
- [ ] Verify partial payments, outstanding balances, discounts, reprints, corrections/reversals and complete finance audit trail.
- [ ] Enforce bursar financial-only permissions server-side; principal must not access pupil financial records.
- [ ] Paystack: school-authorised representative owns the merchant account with official school details. Bursar coordinates setup. Use server-side transaction initialisation, signed webhook verification, amount/reference/currency checks and idempotent processing. Never expose secret keys in the browser or commit them to GitHub.
- [ ] Inventory/office sales must not silently create pupil invoice charges.

## Attendance, timetable and teacher oversight

- [x] Admin has a read-only oversight page for existing staff clock-ins, timetables, lesson plans and CBT exams.
- [ ] Confirm the 400-metre geofence radius. The configured radius is not school-approved until management confirms it.
- [ ] Confirm whether 07:30 is the exact late-marking cutoff and whether any grace period exists.
- [ ] Admin can review clock-ins/outs, lateness, authorised corrections and correction audit history.
- [ ] Class register supports present/absent/late, absence reasons and authorised corrections.
- [ ] Teacher can create/update timetable entries for assigned class/subjects, subject to school approval and conflict checks.
- [ ] Students and parents can see only the timetable applicable to their class/linked children.
- [ ] Add an explicit lesson-start / class-in-progress signal tied to teacher, assigned class, subject, timetable slot and timestamp; add lesson-end/completed state and prevent duplicate/unassigned starts.
- [ ] Teacher lesson notes support submission, principal/headteacher review and visible approval status. Current oversight page display alone is not proof of this workflow.
- [ ] Admin can inspect CBT exams, lesson notes, schedules, subject allocations and publication status.
- [ ] Announcements and Community Wall tested for create/edit/delete, audience scope, attachments, comments, moderation and appropriate parent/student visibility.
- [ ] Ask for browser/device notification permission only after an explanation and a clear user action. In-app notifications remain available when permission is denied.

## Role-based access control

- [ ] Proprietor / Super Admin: full school-wide access, including finance, academic records, staff, settings, analytics and audit history.
- [ ] Principal / Headteacher: academic oversight, pupil records, timetable, attendance, lesson notes and results; no financial amounts, invoices, receipts or payment controls unless management explicitly authorises otherwise.
- [ ] Bursar: finance, fee catalogue, invoices, payments, receipts, discounts and finance reports; no student results or grade editing.
- [ ] Teacher: assigned classes/subjects, attendance, lesson notes, timetable, assignments and authorised CBT workflows only.
- [ ] Parent: own linked children only, including published reports, timetable, attendance, fees and school notices.
- [ ] Student: own permitted learning, timetable, attendance, exams and published reports only.
- [ ] Enforce these boundaries in backend RLS, RPCs and Edge Functions. Hiding a navigation item or disabling a button is not a security control.
- [ ] Test both allowed and denied actions with separate role accounts, including direct API requests and guessed record IDs.

## CBT

- [ ] Improve the existing online CBT in this repository; distinguish it from the separate offline Windows application.
- [ ] Teacher question bank supports subject/class/session, objective and theory questions, protected answer keys, draft/published status and audit history.
- [ ] Candidate eligibility, exam window, attempt limits and ownership enforced server-side.
- [ ] Visible timer/navigation, editable answers before submission, restart recovery and idempotent submission.
- [ ] Objective marks calculated server-side; theory awaits teacher marking; topic analysis requires reliable topic tags.
- [ ] Test at least two candidates for cross-candidate exam, answer-key, submission and result access.
- [ ] Separate Windows desktop app remains outstanding: Electron + React/TypeScript + SQLite, offline attempt persistence, restart recovery, secure/idempotent sync, candidate isolation, Windows installer and acceptance tests.

## AI, wellbeing and analytics

- [ ] Refresh the student AI helper interface using the actual school design system and real app flow.
- [ ] Add age-appropriate moderation and refusal for unsuitable requests; use Socratic guidance rather than completing assessed homework or exams.
- [ ] Image questions use approved server-side processing with file-type/size limits and no client-side secrets.
- [ ] Display a sensible confidence/answer-quality indicator with a plain explanation that it is an estimate, not a guarantee of correctness.
- [ ] Review wellbeing suggestions as prompts for authorised staff follow-up, not diagnoses or automatic discipline/promotion decisions. Restrict sensitive notes and audit access.
- [ ] Predictive analysis shows data window, sample size, missing-data caveats and transparent factors. Missing data must not be presented as evidence of poor performance or risk.
- [ ] Reconcile every analytics KPI and chart against source database queries; label empty data as unavailable rather than inventing values.
- [ ] Finance analytics use consistent invoice/receipt/payment filters and distinguish billed, collected, refunded and outstanding amounts.
- [ ] Student/staff totals use current status and avoid duplicate counting.
- [ ] Answer ratings are feedback signals, not proof that an answer is correct.

## Documents and training

- [ ] Produce separate, versioned PDF guides for Super Admin, teachers, pupils and parents.
- [ ] Produce a separate internal developer guide documenting implemented, partial, missing and uncertain behaviours with file/table/policy references.
- [ ] Use screenshots from the actual app; mask real pupil/staff information and never include credentials, tokens or private contact data.
- [ ] Train Mr Joseph separately, then arrange a joint WhatsApp screen-share session for the Headteacher, Assistant Head Teacher and Bursar / ICT contact.
- [ ] Offer an approximately one-hour practical session and share the relevant PDF guides in advance.
- [ ] Agree how the Assistant Head Teacher or another designated staff lead will cascade training to teachers, and how parents/pupils will receive access instructions.

## Required acceptance run

1. Build/lint the latest branch and run existing unit/e2e tests. Record blocked checks.
2. Sign in as proprietor, principal, bursar, teacher, student and parent test accounts; verify permitted and denied operations at both UI and database/API levels.
3. Import a spreadsheet with quoted commas, missing fields, duplicates and existing admission numbers; verify safe retry and row-level feedback.
4. Create/edit a class, teacher, parent, pupil and subject allocation; reload and confirm audit history.
5. Test 40/60 score entry, descriptive remarks and specialist A–E entry only after the school confirms its thresholds and entry method.
6. Publish a report, switch between sessions/terms in pupil and parent views, then record a progression decision and verify history access.
7. Create a class-specific book/notebook fee once approved prices are supplied; test mandatory purchases, optional uniforms/clubs and duplicate-charge prevention.
8. Make two partial payments, print a receipt, replay a duplicate payment event and reconcile balances.
9. Test 07:30 late marking, the approved radius once confirmed, authorised corrections, timetable editing, lesson start/end and admin visibility.
10. Run online CBT with two candidates, reload during an attempt, submit twice and verify no cross-candidate access or duplicate result.
11. Test announcements/Wall and notifications with permission granted and denied.
12. Reconcile analytics against hand-calculated source records; test AI refusals, image prompts and uncertainty indicators.
13. Build and install the offline Windows CBT app on a clean Windows machine; test disconnected exams, restart recovery and later sync.
14. Complete training and record staff acceptance issues before production handover.

## Known verification limitation — 10 November 2026

The GitHub PR containing the progression migration and oversight/fee changes is merged. The Supabase management connection timed out during this turn's migration check; therefore live migration state, current RLS behaviour, production build status and end-to-end acceptance remain unverified. Do not mark them complete until checked.
