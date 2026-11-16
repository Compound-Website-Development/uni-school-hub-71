# Imagemakers CBT Desktop — Implementation Specification

**Status:** architecture and acceptance criteria; not yet a verified executable.
**Purpose:** a standalone CBT application for school computers, with offline exam delivery and later synchronisation to the existing Supabase-backed school system.

## Product boundary
- Separate desktop application, not another route inside the main school-management dashboard.
- Electron shell with a React/TypeScript interface; SQLite for local exam packages, candidates, sessions, answers, and sync queue.
- Supabase remains the central source of truth for published exams and final submitted results when connectivity is available.
- Admin/staff portal remains the exam authoring and reporting area; desktop app is the exam-room client. Avoid duplicating exam-authoring features unless later requested.

## Teacher workflow
1. Authorised staff create an exam in the existing staff/admin portal.
2. Set title, subject, target class/arm, duration, start/end window, question order policy, and publication status.
3. Add multiple-choice questions and options; validate correct answer and points for each question.
4. Publish only after target class, dates, duration and question set are valid.
5. Desktop supervisor downloads the published exam package while online, verifies its signature/hash, and assigns it to a local exam session.
6. Start session; candidate identifies themselves with admission number and class/arm. Validate candidate against the downloaded roster; do not rely on name alone.
7. Candidate answers, navigates backward/forward, changes answers before submission, sees question progress and timer.
8. On submit or time expiry, freeze the attempt, score objective questions, create a tamper-evident result record, and queue sync.
9. When internet returns, sync attempts idempotently; show pending/synced/failed states. Never silently discard a result or overwrite a newer accepted submission.

## Offline data and sync
- Use SQLite transactions for durable local state; do not use localStorage as the answer database.
- Persist each answer change and remaining deadline promptly. The timer must use an absolute deadline, not only decrementing in-memory state.
- Keep an append-only local attempt event log with attempt UUID, exam version/hash, candidate ID, start time, deadline, answers, submit time, score, and sync status.
- Idempotency key: attempt UUID. Server must reject duplicate final submissions and prevent changing a finalised attempt.
- Sync with exponential backoff; retain unsynced data and display a clear warning until server acknowledgement.
- Handle clock changes conservatively. Record system clock at start and elapsed monotonic time where available; flag suspicious clock jumps for staff review.
- Use versioned exam packages and reject an attempt if the package hash or exam version is unknown to the server.
- Back up local database and provide an authorised export/recovery path for unsynced attempts.
- Protect local files using OS file permissions and encryption at rest where feasible. A determined user with access to the exam computer may inspect client-side content; offline delivery cannot offer the same secrecy as a server-only exam. Keep answer keys out of ordinary UI payloads and minimise time in memory.

## Exam-room controls
- Full-screen kiosk mode with clear exit confirmation and staff-authorised exit; prevent in-app navigation to other candidates' results.
- Do not promise that a normal desktop app can make exiting or OS-level access impossible. For stronger lockdown use managed Windows kiosk/Assigned Access and a supervised account.
- Candidate can see only their own current attempt and own result if school policy allows immediate results.
- Teacher reports should group attempts by session, class/arm, subject, exam, and candidate, with CSV/PDF export and clear offline-sync status.
- If results are to be immediately shown after submission, ensure the score is calculated from trusted exam data and that the candidate cannot query other attempts.

## Security requirements
- Never ship Supabase service-role keys or database secrets in the Electron bundle.
- Authenticate staff actions; use short-lived tokens and role checks on server-side RPC/Edge Functions.
- RLS and server-side validation are mandatory; UI hiding is not authorisation.
- Students must not be able to read correct answers before submission, list other students, or alter another candidate's attempt.
- Validate all inputs, exam windows, candidate/class membership, score bounds, and final-submission state server-side.
- Rate-limit candidate lookup/login endpoints and avoid exposing whether arbitrary admission numbers exist.
- Do not claim “cannot be hacked”; document and test the threat model.

## Windows packaging
- Build a Windows installer (.exe) using Electron Builder in GitHub Actions.
- Publish build artifacts to a GitHub Release; do not auto-deploy or publish exam data as artifacts.
- Pin dependencies and use npm ci; run lint/typecheck/tests before packaging.
- Store signing credentials only in GitHub Actions secrets. Unsigned builds should be clearly labelled as test builds.
- Keep the desktop CBT's own package.json and lockfile isolated from the school web app.

## Acceptance tests before school use
- Offline launch, candidate roster loading, exam start, timer, answer edits/navigation, app restart recovery, submit, local score, and pending-sync state.
- Reconnect sync: one and only one server submission per attempt; verify answer/score integrity.
- Candidate cannot see another candidate's result or correct answers before submit.
- Teacher can create/publish exam for correct class/subject and view results by class/arm.
- CA/exam report-card calculation remains CA 40% + exam 60%; remarks match the official school bands.
- Test on the actual school Windows computers and network before live examinations.
