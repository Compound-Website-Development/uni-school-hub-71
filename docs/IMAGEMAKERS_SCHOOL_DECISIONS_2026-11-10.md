# Imagemakers — confirmed school decisions and open items

**Updated:** 10 November 2026  
**Source:** WhatsApp replies from Mr Otuagoma Joseph on 9 November 2026.  
**Purpose:** Keep school-approved rules separate from assumptions and implementation notes.

## Confirmed by school management

| Area | Confirmed information | System treatment |
|---|---|---|
| Promotion | A pupil needs at least a **50% average** to qualify for promotion. | Show 50% as the promotion threshold. A school administrator records the final promotion, repetition or demotion decision; the system must not promote a pupil automatically. |
| Staff clock-in | The stated clock-in time is **7:30 a.m.** | The shared school configuration now uses 07:30 as the late-marking cutoff. Do not add an unapproved grace period. |
| Textbooks and notebooks | Parents must buy textbooks and notebooks through the school office. | Treat the school as the required purchase source. Build class-specific book lists and notebook options; do not invent prices. |
| Specialist-subject grades | French, Diction, Coding, Abacus, Creative Art and Yoruba use letter grades **A, B, C, D or E**. | The subject list and permitted letters are recorded in configuration. Numeric boundaries and the exact data-entry/report-card workflow have not been supplied; do not derive them. |
| ICT/payment coordination | Mr Joseph said the bursar can stand as the ICT contact for the payment setup. | Coordinate technical onboarding with the bursar. The merchant account must belong to the school and be controlled by an authorised school representative. |

## Previously supplied fee reference amounts

Keep the existing approved amounts; do not infer new prices:

| Item | Amount |
|---|---:|
| Monday/Tuesday uniform pair | ₦26,500 |
| Wednesday wear | ₦10,000 |
| Friday wear | ₦10,000 |
| Taekwondo | ₦18,000 |
| Red Cross | ₦12,000 |
| Cub Scout | ₦18,000 |
| Brownie | ₦12,000 |

Uniforms remain optional selections per pupil and term. These are not automatic recurring term charges.

The existing club options and prices should be preserved. Confirm whether every pupil must choose exactly one club and whether all club options are compulsory before changing their billing flags. Do not silently make all clubs mandatory.

## Details still required from the school

### Books and notebooks
- Confirm each class's required textbook titles, subjects, editions and quantities.
- Confirm the price of each textbook, per class and subject.
- Confirm the notebook price for 40-leaf, 60-leaf and 80-leaf options.
- Confirm whether notebook quantity is a fixed bundle per pupil or chosen by the school office.
- Confirm whether book/notebook charges are billed as invoice line items, recorded as office purchases, or both. Avoid double charging.
- Confirm whether a pupil joining mid-term pays the full book bundle or a pro-rated amount.

### Attendance
- The **400-metre** campus radius is an existing configuration, not a newly approved rule. Management still needs to confirm it.
- Clarify whether 7:30 a.m. is the exact point after which a clock-in is marked late, and whether there is any grace period.
- Confirm who may correct attendance and what audit trail the school expects.

### Academic results
- Confirm whether the specialist A–E grade is entered directly by the teacher or derived from numeric marks.
- If derived, obtain the approved score boundaries for A, B, C, D and E.
- Confirm whether specialist subjects count towards the overall average used for the 50% promotion threshold.
- The 40% CA / 60% examination weighting remains the existing approved numeric-results arrangement. Confirm that teachers should enter CA out of 40 and examination out of 60, as the current gradebook labels indicate.
- Confirm the specialist-subject teacher allocations and whether each specialist subject appears on every class's report.

### Promotion and progression
- The 50% average is the qualification threshold, not an automatic decision. The school must still decide whether an individual pupil is promoted, repeated or moved to another class.
- Confirm whether the average is calculated per term, across the full session, or both.
- Confirm any exceptions, review process and who authorises final decisions.

### Payment gateway
- The school must register and own its Paystack merchant account using the school's official details and any required CAC documentation.
- The bursar coordinates the setup, but account ownership and final authority remain with the school.
- Do not send secret keys, passwords, OTPs or recovery codes in WhatsApp or commit them to GitHub. Configure secrets only in the secured server-side environment.
- Confirm the school's settlement bank account and authorised signatory through the school's private setup process, not in this repository.

## Staff and training contacts

The school identified these roles for onboarding:
- Headteacher: Mrs Mpamah Anthonia.
- Assistant Head Teacher: Mrs Aniekwe Jessica.
- Bursar / ICT coordination contact: Mrs Sobaloju Abiola.

Contact phone numbers are intentionally not copied into repository documentation. Use the numbers supplied privately by the school only to create the agreed WhatsApp group and contact the staff.

## Implementation guardrails

1. Never fabricate tuition, textbook, notebook or other fee amounts.
2. Keep uniform purchases optional and per pupil/term.
3. A mandatory book purchase must not be charged twice through both an invoice and a separate office-sales record.
4. The 50% promotion threshold must not trigger an automatic class change.
5. Specialist A–E grades must not be translated into invented numeric boundaries.
6. The clock-in time is 07:30; the geofence radius is still awaiting approval.
7. Proprietor, principal and bursar access must be enforced by backend policies, not merely hidden navigation links.
8. Parent access to a pupil's reports and progression history must be scoped to linked children; a pupil-only ownership policy is not enough for parent accounts.
9. Do not introduce boarding/hostel or school-owned bus workflows. The school has no boarding facility and no longer operates its own bus service.
10. Mark every feature as implemented, partially implemented, unimplemented or not yet verified. A screen existing in the repository is not proof that its full workflow works.

## Current implementation notes

- PR #5, which added the fee category/class/term groundwork, read-only staff oversight page and admin progression workflow, has been merged to `main`.
- The code configuration now sets the promotion threshold to 50% and clock-in cutoff to 07:30.
- The fee catalogue has category and class/term fields, and optional fee selections. It still needs the structured class-by-class textbook catalogue, leaf-count notebook options and bursar spreadsheet workflow.
- The progression workflow has a database migration and an admin screen. The live Supabase migration state and parent read access must be verified before calling it complete.
- Admin oversight currently displays existing clock-in, schedule, lesson-plan and exam records. The teacher lesson-start signal and teacher-controlled timetable workflow still need implementation/verification.
- Historical report availability must be tested across multiple sessions using published records for both pupil and linked-parent accounts.
