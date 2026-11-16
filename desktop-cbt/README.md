# Imagemakers CBT Desktop

Standalone Windows examination station built with Electron, React, TypeScript and SQLite. It is separate from the school portal runtime. Staff author and publish real exams in the existing school portal; the desktop station imports a signed package, assigns an exam to the room and runs candidates offline.

## Implemented in this branch

- Local SQLite schema upgrades, WAL mode, full synchronous writes, foreign keys, integrity diagnostics and startup recovery.
- Eighteen clearly labelled demo assessments: Primary 1–3 × Ruby/Sapphire × Mathematics, English and Basic Science.
- Four demo candidates per class/arm. Demo admission numbers follow DEMO-P1-R-001 (Primary 1 Ruby), DEMO-P1-S-001 (Primary 1 Sapphire), and the same pattern for Primary 2 and Primary 3. Demo names are Ada Okafor, Daniel Bello, Mary James and Samuel Musa.
- Supervisor exam selection and station assignment.
- Candidate validation by admission number plus matching registered name.
- Timed objective exam runner with question grid, previous/next navigation and answer changes.
- Answer persistence after each selection, persisted deadline and restart recovery. The timer continues against the original deadline after restart.
- Local objective marking for demo exams and imported signed packages. Real results are recalculated by the server during sync.
- Candidate result lookup is restricted to the candidate's own attempt. Supervisor results require a six-digit local supervisor PIN.
- .imexam and .json file selection for signed JSON-envelope exam packages. The file content is JSON; .imexam is the school package extension. The package carries a separate marking key, which the desktop app encrypts with Windows secure storage when imported. The package file itself must be kept restricted because a person who can inspect it can extract that key.
- NSIS installer with maximum compression and renderer-only dependencies moved out of packaged production dependencies.

## Important limitations

Authenticated synchronisation is wired through the deployed cbt-sync Edge Function. Staff sign in inside the desktop app; the access and refresh session is encrypted with Windows secure storage. The function verifies the staff JWT and role, class/subject assignment, candidate admission number and class membership, published exam window, registered package version/hash, and answer/question IDs. It recalculates the objective score against the server answer key and records the result through a service-role-only idempotency function. Duplicate retries for the same attempt ID return the original receipt; conflicting payloads are rejected. No service-role key is bundled in the desktop app.

The existing student_exam_questions() and submit_exam() functions remain unchanged. The desktop integration uses separate server-side functions and private receipt tables; execution is restricted to service_role. A new delivery_mode field keeps desktop-only exams out of the browser practice portal.

Offline marking is available immediately after submission. The marking key is not sent to the React candidate renderer and is encrypted in the local SQLite record using Windows secure storage. However, the signed .imexam file contains the separate key before import, so package files must be handled like confidential exam papers. A determined person with access to the file or the Windows account may still extract it. Server-side marking remains authoritative during sync.

The local supervisor PIN protects the results screen from casual access; it is not a substitute for Windows account controls, device encryption, or a centrally managed staff identity. The app does not currently enforce Windows kiosk mode. Backward system-clock changes are flagged and the sync endpoint rejects attempts flagged for staff review.

## Build

From this directory:

    npm install
    npm run dev
    npm run build
    npm run package:win

The Windows workflow is intentionally preserved: Windows 2022, Node 22, Python 3.12, dependency installation, renderer build, NSIS packaging and artifact upload. The workflow currently uses npm install; a committed npm lockfile should be added before treating releases as reproducible. The workflow file itself has not been edited in this work.

## Installer size

Electron bundles the Chromium runtime and is inherently large. This branch removes renderer-only production dependencies and enables maximum NSIS compression. A build must be measured before claiming it is below 50 MB. If the installer remains above 50 MB, reaching that target reliably will require changing the desktop shell (for example, a WebView2/Tauri design) rather than removing essential CBT functionality.

## Not school-ready until

- Authenticated and idempotent sync to the existing school system is implemented and tested.
- Real exam packages are generated and signed by the staff portal and verified by this app.
- Real Windows install, offline, restart, update, recovery, candidate isolation and data backup tests pass on the school's computers.
- School management approves the timer policy, PIN custody, retention period and result-release policy.


## Demo exam files shipped with the Windows artifact

The Windows Actions artifact includes a bundle containing the installer and signed demonstration `.imexam` files in a `demo-exams/` folder. The desktop app also seeds all 18 demo combinations locally (Primary 1–3 × Ruby/Sapphire × Mathematics, English and Basic Science). The shipped files are importable sample packages; automatic local seeding remains available even if the files are not manually imported.

Demo packages use a separate public verification key. That key cannot authorise real school packages. Demo attempts are marked locally and excluded from the school's sync queue. Demo content and answer keys are public practice material.

The bundle reports the exact executable size. The current Electron executable is still expected to be large; this change does not claim the under-40-MiB target has been met. That target requires completing and measuring the separate Wails migration.
