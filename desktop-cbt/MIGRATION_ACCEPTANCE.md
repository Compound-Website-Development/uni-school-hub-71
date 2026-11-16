# Wails migration acceptance plan

This branch is the isolated Wails v2 migration track. The merged Electron release remains on `main` as the rollback point.

## Target architecture

- Wails v2 desktop shell; Go owns all privileged operations.
- React + TypeScript + Vite renderer retained.
- SQLite through `database/sql` and `modernc.org/sqlite`; `CGO_ENABLED=0`.
- SQLite startup: integrity check, WAL, synchronous FULL, foreign keys, busy timeout, one open connection, schema migrations and demo seeding.
- Supabase Auth and `cbt-sync` calls from Go over HTTPS. No service-role key in the client.
- Native file picker for signed `.imexam` import.
- CSV is the bulk question-bank interchange format. It is not the trusted offline package format; the signed `.imexam` envelope remains the offline delivery format.
- Candidate start requirements are school-configurable; admission number remains the primary roster lookup key. The configured name/class fields are validated against the roster rather than trusted as free-form identity.

## Demo delivery

The release artifact must contain:
- The portable Windows executable.
- A `demo-exams/` folder with importable demonstration exam packages.
- CSV question-bank examples/templates.
- A short README listing demo classes, subjects, admission numbers and how to run a demo.

Built-in demo database seeding and shipped demo files are separate acceptance checks. A passing build must verify both are present in the artifact.

## Dashboard integration

- Staff/teacher portal: create and publish objective exams, choose desktop-offline or browser-practice delivery, download signed packages, manage question CSV imports and view synced results.
- Admin portal: configure candidate start fields and permitted identity checks, manage exam availability, supervisor policy and results access.
- Student portal: browser practice remains separate; desktop-offline exams are not offered as browser attempts. Synced official results are visible in the student result area according to school release policy.
- Parent portal: display only released official results and exam status; parents do not get exam-authoring or station-control actions.

## Security decision that must be preserved

A truly answer-key-free package cannot be marked offline by the station unless the station receives the marking key through a separate protected channel. The migration must not silently put plaintext correct answers in the question CSV or candidate renderer. Demo answer keys may be seeded locally because the demo content is public. Real-exam marking must use a protected key-delivery design or be marked by the server after sync.

## Release gates

1. `go test ./...` passes, including database migration/recovery, signed package validation, attempt deadline recovery and CSV parsing.
2. Windows x64 workflow builds with `CGO_ENABLED=0` and `wails build -platform windows/amd64 -clean -ldflags="-s -w"`.
3. Artifact contains the EXE, demo package files and CSV templates.
4. Workflow reports exact EXE byte size and fails if size is 40 MiB or greater.
5. Actual uploaded artifact is downloaded and measured; target is strictly below 40 MiB.
6. End-to-end test covers staff publish/download, import, candidate validation, timed attempt, restart recovery, submit, sync, duplicate retry and student/parent result visibility.

No size, test or end-to-end claim is accepted based only on a successful source build.
