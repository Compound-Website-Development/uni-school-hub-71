# Imagemakers SMS — Sky Blue Rebrand, Parent ID Access & Klacify-style Operations

This plan covers everything still outstanding from your requirements: the sky-blue brand shift, removing parent self-signup in favour of a Parent ID, the richer student record with editable temporary class placement, the new ID card design, the public QR profile, and the Klacify-inspired teacher/admin operations.

## Phase 1 — Sky blue brand (school's major colour)

Current theme is navy-dominant (`--primary: 217 78% 24%`). Change the token layer only, so every screen, card, sidebar, PDF and ID card follows:

- Primary becomes sky blue; navy is demoted to a supporting/deep token for text and card headers; gold stays as accent; white stays as surface.
- Update light and dark palettes, sidebar tokens, gradients, and the hard-coded card colours used in the ID card PDF generator.

## Phase 2 — Parent access via Parent ID (no self-signup)

- Remove the "Parent" option from the login/signup selector so parents can never create their own account.
- Each student record gets a generated, unique **Parent ID** (e.g. `IMS-P-XXXXXX`) plus an access code, printed on the back of the card.
- New parent entry page: parent enters Parent ID + access code, and is signed in to the Parent Dashboard scoped to the linked child/children. Two parents can use the same ID.
- Admin screen to view, regenerate and revoke a Parent ID, and to link a second child to the same parent.

## Phase 3 — Full student record + verified editing

Extend the student record and the admin form/table to hold every field on your list: admission number, first/middle/surname, gender, DOB, class, section/arm, parent name, parent phone, guardian, address, admission date, status, photo, QR/parent ID, created at.

- Photo upload (passport) with a placeholder when missing.
- **Age-based temporary class suggestion**: from the DOB, the importer proposes a class (Kindergarten → Grade Six) which the admin can override per row before saving, and change any time afterwards.
- Admin table gets: inline edit, bulk class move, delete (with confirm), and a **"Verified by school"** flag per student so ID cards are only generated for verified records.
- Importer keeps unreadable fields blank rather than guessing, and flags rows with missing DOB/parent for review.

## Phase 4 — ID card (design 6 style)

- Rebuild the card as the landscape design-6 layout: school logo from the project assets, sky-blue/navy blocks, passport photo placeholder, name, class, admission number.
- Back: QR code to the public profile, Parent ID + access code, school address and return notice.
- Batch print for a whole class; blocked for unverified students.

## Phase 5 — Public QR profile

A public, read-only route (`/s/:token`) that the QR opens: student photo, name, class, admission number, attendance summary and published results only. No editing, no personal contact details exposed.

## Phase 6 — Klacify-style operations

- **Teacher clock-in/out** with promptness score, plus an admin view of daily arrivals and lateness.
- **QR attendance scanner** in the teacher portal (camera scan of the student card) writing straight into attendance, with the parent dashboard reflecting it immediately.
- **Idle-class flag**: timetable slot started late or not started marks the class idle for the admin dashboard.
- **Parent payment proof upload** with an admin "Verify payment" queue that updates fee status.

## Technical notes

- Database work: new columns on `students` (gender, parent phone, section, photo, verified flag, parent access token), a `parent_access` table for Parent ID + hashed code + child links, a `staff_attendance` table for clock-in/out, and a `payment_proofs` table. Each with grants and RLS: public profile data is served through a narrow security-definer function, not a public table grant.
- Parent ID sign-in runs through an edge function that validates the code server-side and mints a session; the code is never checked in the browser.
- Photos and payment proofs go in Supabase Storage (private bucket, signed URLs).
- Colour work is confined to `src/index.css`, `tailwind.config.ts` and the PDF colour constants — no per-component hard-coded colours.

## Deliberately not in this plan

Geofenced clock-in (needs the school's exact GPS coordinates), SMS/WhatsApp sending (needs a provider and school phone number), fee structure and bank/receipt details, and the mobile app wrappers. Say the word and I'll add any of these once the school supplies the missing details.

## Suggested build order

Phases 1 → 2 → 3 first (brand, parent access, accurate editable data), then 4 → 5 (cards and QR), then 6 (operations).
