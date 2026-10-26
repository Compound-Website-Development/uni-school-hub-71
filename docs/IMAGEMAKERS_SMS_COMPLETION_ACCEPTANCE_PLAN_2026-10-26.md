# Imagemakers SMS — Completion and Acceptance Plan
Updated: 26 October 2026

This is the implementation and acceptance checklist for the existing repository. A feature is verified only after its database workflow and role restrictions pass tests; a visible screen alone is not proof.

## Decisions to keep explicit
- CA/exam weighting is 40%/60%. Confirm whether teachers enter both marks out of 100 or use different maximums.
- Use school-confirmed descriptive bands: 0–39 Poor; 40–49 Fair; 50–59 Good; 60–69 Very Good; 70–89 Excellent; 90–100 Outstanding. The A–F mapping is not approved as an official scheme yet.
- The 400-metre staff clock-in geofence and 07:45 cutoff require management approval and a written late-arrival policy.
- Specialist teacher allocations and how French, Diction, Coding, Abacus, Creative Art, Yoruba and other specialist subjects count toward results remain to be confirmed.
- Preserve supplied uniform and club amounts. Do not invent tuition, textbook or notebook prices.
- Promotion rules require school approval. AI must not make final promotion decisions.

## Academic management
- [ ] Downloadable pupil and staff spreadsheet templates.
- [x] Bulk pupil upload now renders inside the Admin layout.
- [x] Import preview warns about repeated pupil name/guardian-phone combinations; it does not merge or delete records automatically.
- [ ] Proper quoted-CSV parsing, required-field/date/class/admission-number validation.
- [ ] Duplicate checks against existing database records and safe per-row batch recovery.
- [ ] Admin editing for pupil, guardian/parent, staff, class, arm, subject and teacher records, with audit history.
- [ ] Class/arm/subject/teacher allocations and specialist-subject handling.
- [ ] CA/exam entry using 40/60 weighting, validated score ranges and maximums.
- [ ] Approved descriptive remarks, missing-mark checks, report-card preview, approval and publication.
- [ ] Historical report cards retained by session and term after promotion or graduation.
- [ ] Promotion, demotion or repeat workflow retaining old class, new class, session, date, approver, reason and decision.
- [ ] Students/parents can access only their own published current and historical reports.

## Finance, inventory and receipts
- [x] Keep the existing Finance Dashboard; do not create a duplicate.
- [x] Printable receipt now includes the school logo, name, motto, address, approval number and payment details.
- [ ] Configurable line items for tuition, levies, uniforms, textbooks, notebooks/exercise books, clubs, trips, examination and other school-defined charges.
- [ ] Each fee supports class/arm, session, term or one-off applicability, quantity, amount, mandatory/optional flag, due date and active status.
- [ ] Uniforms must not be charged automatically every term unless configured that way.
- [ ] Textbooks are configured by class and subject/title, with editable prices and quantities; notebook items also support quantity and mandatory/optional settings.
- [ ] Keep unconfirmed tuition/textbook prices blank or zero until authorised staff enter them.
- [ ] Repeat-safe invoice generation that never overwrites payments or manual invoice adjustments.
- [ ] Partial payments, balances, discounts, receipt reprints, payment history and correction/reversal trail.
- [ ] Bursar permissions tested separately from principal/proprietor permissions.
- [ ] Paystack: school-authorised representative owns the account using official school/CAC details. Server creates transactions, verifies reference/amount/currency, validates signed webhooks and processes each successful payment once. Never expose secret keys in browser code.
- [ ] Excel-friendly import/export using .xlsx/CSV templates, keyboard-friendly grid editing and formula-injection-safe exports. This is not a full Excel clone.
- [ ] Inventory/sales records must not silently add charges to pupil invoices.

## Attendance, timetable and communication
- [ ] Admin can see staff clock-ins/outs, late status, corrections and correction audit logs.
- [ ] Confirm the geofence and cutoff with management and publish the late-arrival policy.
- [ ] Class registers support present/absent/late, absence reason and authorised corrections.
- [ ] Teachers can manage their own timetable within school policy; students and parents see the correct class timetable.
- [ ] Optional lesson start/end check-in tied to the scheduled class, teacher, subject and timestamps. Do not add audio recording or intrusive monitoring without explicit approval and a privacy/consent policy.
- [ ] Admin can inspect CBT exams, lesson notes, timetables, class/subject allocations and publication status.
- [ ] Announcements/community support audience targeting, author, timestamps, edit history and delivery/read status where supported by the delivery channel.
- [ ] Ask for device notification permission only after a clear user action and explanation; in-app notifications remain available if permission is denied.

## CBT
- [ ] Improve the existing online CBT in this repository; this is not the separate offline desktop app.
- [ ] Teacher question bank supports subject/class/session, objective and theory questions, protected answer keys, draft/published status and audit history.
- [ ] Candidate eligibility, exam window, attempt limits and ownership enforced server-side.
- [ ] Visible timer/navigation, editable answers before submission, restart recovery and idempotent submission.
- [ ] Objective marks calculated server-side; theory awaits teacher marking; topic analysis requires reliable topic tags.
- [ ] Test two candidates against cross-candidate exam, answer-key, submission and result access.
- [ ] Separate Windows app remains a distinct deliverable: Electron + React/TypeScript + SQLite, local attempt persistence, restart recovery, secure/idempotent sync, candidate isolation, Windows installer and acceptance tests. This plan does not mean that desktop app has been built.

## Analytics and AI
- [ ] Reconcile student/staff counts against source tables and current status.
- [ ] Finance analytics must use consistent invoice/receipt/payment filters and distinguish billed, paid, refunded and outstanding totals.
- [ ] Grade charts use the approved descriptive grading policy, not unapproved A–F labels.
- [ ] Predictive analytics show data window, sample size, missing-data caveats and transparent factors; missing grades alone must not label a child as at risk.
- [ ] Wellbeing suggestions are prompts for authorised staff review, not diagnoses or automatic disciplinary decisions. Restrict sensitive notes and audit access.
- [ ] AI tutor supports explanations, vocabulary and research guidance without completing assessed homework/exams; add age-appropriate safeguards and privacy controls.
- [ ] Image processing only through an approved server-side provider with file-type/size limits and no client-side secrets.
- [ ] Answer-quality ratings are user feedback, not a guarantee of accuracy; low-rated responses can be reviewed.

## Admin navigation and documents
- [x] Bulk upload route uses Admin layout.
- [x] Desktop admin sidebar preserves scroll position across admin route changes.
- [ ] All admin actions stay in Admin; no admin menu item should require the Staff dashboard.
- [ ] Admin can inspect/edit staff and pupil directories, CBT exams, notes, timetables, clock-ins, announcements, finance, report cards, documents and audit logs.
- [ ] Add official report-card viewing/export to Admin Documents with session/term selection and proper access restrictions.
- [ ] Verify every dashboard card, chart, quick action, sidebar item, form, export and empty/error state against live data.

## Required acceptance run
1. Sign in as proprietor, principal, bursar, teacher, student and parent test accounts; verify allowed and denied actions.
2. Import CSV with quoted commas, missing fields, duplicates and existing admission numbers; test safe retry.
3. Create/edit class, teacher, parent, pupil and subject allocations; reload and confirm persistence.
4. Test marks 0, 39, 40, 49, 50, 59, 60, 69, 70, 89, 90 and 100 and confirm weights/remarks.
5. Publish a report, promote/repeat a test pupil and verify historical report plus promotion decision.
6. Create multi-item invoice, select optional items, make two partial payments, print receipt, replay a duplicate payment event and reconcile balances.
7. Test clock-in, authorised correction, timetable, lesson start/end and admin visibility.
8. Run CBT with two candidates, reload during an attempt, submit twice and verify no cross-candidate access or duplicate result.
9. Test announcements and device notifications with permission granted and denied.
10. Reconcile analytics against hand-calculated source records; review AI and wellbeing safeguards.
11. Run lint/build and end-to-end tests. Record blocked checks; do not mark them done.
