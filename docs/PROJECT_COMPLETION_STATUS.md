# Imagemakers SMS — Engineering Completion Status
Date: 22 September 2026

## Work completed in this engineering pass

- Added a dedicated driver application role in Supabase.
- Added transport driver profiles, trips, live location points and parent/student route-authorisation tables.
- Added RLS so driver location is not globally visible: admins can supervise, drivers can operate their own trips, and only parents explicitly linked to pupils on a route can read that route's live trip locations.
- Added /driver with a mobile-friendly driver dashboard that uses the device geolocation API and records live points while a trip is active.
- Added /parent/transport with an authorised parent bus-tracking view and Google Maps handoff for the latest recorded coordinate.
- Added parent controls for each linked child to enable/disable the AI tutor and calculator.
- Added a student calculator and gated AI tutor using the parent-controlled feature settings.
- Hardened the AI assistant edge function so it requires authentication and uses a primary-school-specific tutor prompt rather than the old secondary-school framing.
- Removed synthetic Grade 10/11/12 schedule fallback data from the staff dashboard. Empty real schedule data now stays empty.
- Refreshed Admin, Staff and Parent dashboard surfaces with a shared 2026 visual layer: motion, elevated surfaces, responsive spacing and portal-specific accent treatment. The Student dashboard already had its dedicated visual rebuild and custom SVG glyphs.
- Added the school data-collection / Joseph handoff text file.

## Important unfinished items

These are intentionally NOT marked complete because they require real school data, a school-owned account, or browser/device verification:

1. Reconcile every pupil against the school's final 2026/2027 class-by-class register.
2. Collect and attach the correct pupil photographs.
3. Confirm the final teacher/class and specialist-subject assignments.
4. Confirm exact current term dates, subjects and timetable.
5. Begin real attendance entry and verify parent/student reflection.
6. Generate real invoices from the approved fee schedule and confirm discounts/scholarships.
7. Configure and test school-approved manual payment/receipt workflows with real records.
8. Connect online payments only after the school-owned provider account/configuration is supplied securely.
9. Load real CBT content and run a real staff → student → scoring → result test.
10. Finish transport onboarding: create driver accounts, assign routes/vehicles, link only eligible pupils/parents and test geolocation on an actual phone.
11. Run a full browser/device regression across Admin, Staff, Student, Parent and Driver with real accounts.
12. Resolve remaining Supabase security/performance advisor findings deliberately rather than disabling protections just to silence warnings.
13. Verify the report-card flow in a clean browser and confirm every reader (staff, student, parent and admin) uses the same persisted academic data.

## Do not invent data

The empty states above are intentional. Do not seed fake attendance, marks, invoices, payments, receipts, schedules, CBT questions, transport coordinates or historical trends merely to make a dashboard look populated.

## Continuation prompt

Continue the Imagemakers Nursery and Primary School project from the current main branch and live Supabase project.

Do NOT redesign from scratch and do NOT create duplicate systems.

First inspect the current implementation and live schema. Then complete only the outstanding items in this status file using real school data when it becomes available.

Priority:
1. Reconcile the school register and parent links.
2. Attach verified pupil photos.
3. Confirm class-teacher and specialist mappings.
4. Confirm academic calendar, subjects and timetable.
5. Verify live attendance end to end.
6. Generate and verify real invoices and manual receipts.
7. Add the school-owned online payment provider only when its configuration is securely supplied.
8. Load and test real CBT content.
9. Finish driver onboarding and phone-based live location testing.
10. Run role-isolation and end-to-end regression tests.
11. Fix only verified security/performance issues.
12. Update docs/FUNCTIONAL_SPEC.md after every meaningful feature/data-model change.

Never fabricate school records. If required school information is missing, leave the feature correctly empty and record exactly what is needed in the data-collection document.