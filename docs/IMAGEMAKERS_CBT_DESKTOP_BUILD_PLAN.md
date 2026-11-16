# Imagemakers CBT Desktop — Build Plan

Status: requirements and architecture plan, not a claim that a working installer has been built. Keep the desktop app in its own repository with its own lockfile and release process; do not add Electron packaging dependencies to the school web app.

## Architecture
- Electron main process + React/TypeScript renderer; SQLite for local persistence.
- Use a narrow, validated IPC/preload API. Enable context isolation, disable Node integration in the renderer, sandbox it and apply a strict Content Security Policy.
- Existing Supabase project remains the central source of truth online. Use only public client configuration in the desktop bundle; never bundle service-role keys.
- A repository-creation operation was not available through the connected GitHub tools in this session, so a separate repository must be created before source can be committed there.

## Teacher flow
1. Staff creates exam in existing portal: title, instructions, subject, class/arm, duration, open/close window, questions, options, correct answers and points.
2. Validate and publish an immutable version; editing a published exam creates a new version.
3. Download a versioned exam package and authorised roster to the CBT device while online.
4. Staff result reports group by exam, subject, class/arm and candidate.

## Candidate flow
1. Select assigned exam/class/arm/subject; enter admission number and required identifying details.
2. Validate against locally cached roster; prevent duplicate active/final attempts.
3. Start a persisted deadline and visible countdown. Allow back/forward navigation and answer changes before final submission.
4. Save every answer change promptly to SQLite; use transactions and recover unfinished attempts after restart.
5. Submission or expiry finalises the attempt locally, locks edits and queues it for sync. Show Pending, Synced or Needs attention.
6. Retry sync idempotently when online; never discard unsynchronised attempts or silently overwrite submissions.

## Suggested local records
- exam_packages: exam ID/version, subject, class/arm, schedule, duration, package hash.
- candidate_roster: exam, student ID, admission number, display name, class/arm.
- attempts: unique ID/idempotency key, exam/version, student, start/deadline/submitted timestamps, status, sync status and clock warning.
- answers: attempt, question, selected option and update time.
- sync_queue: attempt, payload hash, retry count and last error.
- audit_events: event type, attempt, timestamp and minimal metadata.

## Security
- Candidate endpoints must not return answer keys before submission. Offline exams necessarily place enough exam content on the device to run; answer-key extraction cannot be ruled out, so limit access and document the risk.
- Validate exam version, roster membership, schedule, question IDs, score ranges and idempotency server-side on sync.
- RLS must isolate candidates to their own attempts/results and scope staff access by role, class and subject.
- Never trust a local score or local clock alone; flag clock changes and stale packages for staff review.
- Protect local files with OS permissions and encryption where practical; minimise stored personal data.

## Windows CI
Use a Windows GitHub Actions runner; install from lockfile; run typecheck, lint and tests; package installer; upload artifact only after successful checks. Store signing credentials in GitHub Actions secrets, never in source or installer. Do not claim school readiness until tested on a real Windows computer.

## Acceptance tests
Exam preparation/download; identity/class validation; timer and deadline persistence; question navigation and answer changes; autosave/restart recovery; offline completion; reconnection sync; duplicate protection; candidate isolation; no pre-submission answer leakage; immutable final submission; teacher reports; Windows installer execution on real Windows hardware.
