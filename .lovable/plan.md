# Parent & Student Billing Portal + Finance Admin

## Status inventory (what exists today)

**Fully implemented**
- Auth with roles (student, teacher, admin, parent), parent login by Parent ID + access code
- Students (132), 13 classes/arms, 17 teacher records, class-teacher links
- Fee items seeded per class (Tuition / PTA 5,000 / Party 10,000 / Lesson 15,000)
- Fee schedule card on parent and student fee pages, scoped to the child's class
- Report cards persisted to grades/term_results, editor is the print layer
- Teacher access scoped to assigned classes; bursar gate on Fee Management
- CBT server-side scoring, geofenced staff clock-in, ID cards with QR, signed photo URLs
- Activity log table + admin viewer

**Partial**
- Fee payments: table exists and admin can list them, but there is no way to record a payment from the UI, no per-student balance, no receipt
- Parent dashboard: shows grades/attendance/announcements but no money view
- Activity log: table is generic; finance changes are not written to it
- Analytics: real roll and fee aggregates, but no debtor/collection reporting

**Not implemented**
- Invoices and receipts (no tables, no documents, no numbering)
- Paystack payments, webhooks, reconciliation
- Payment reminders
- Per-student discounts / scholarships
- SMS and email template manager
- Finance/records policy document manager
- Finance-specific audit trail

## What this batch builds

Focus: the parent money experience end to end, plus the finance admin surface behind it.

### 1. Billing data model
New tables: `invoices` (per student, per term, status, totals), `invoice_lines` (copied from fee items so later price changes don't rewrite history), `student_discounts` (per student + term, fixed or percentage, reason, approved_by), `receipts` (serial number, invoice, amount, method, issued_by), `payment_transactions` (Paystack reference, status, raw payload), `finance_audit` (actor, action, entity, before/after JSON), `message_templates` (channel, key, subject, body with `{{placeholders}}`), `policy_documents` (title, category, version, storage path).

Invoice total = sum of class fee items for the term, minus any approved discount for that student/term. Balance = total minus confirmed payments.

### 2. Parent dashboard redesign
- New "Fees & Payments" hero block: amount due this term, amount paid, balance, due date, and a single **Pay now** button per child
- Invoice view with line breakdown, discount line shown explicitly
- Receipt list with download/print (branded, school crest, serial number)
- Payment reminder banner when a term invoice is unpaid or partially paid past its due date, plus notification records so reminders also appear in the bell menu
- Overall visual pass on the parent dashboard: fewer competing cards, one clear child selector, money and academics as two distinct sections

### 3. Student dashboard design pass
Same visual language, read-only money summary (balance owing, no pay button), tightened card hierarchy, consistent spacing and sky-blue accents.

### 4. Paystack
Edge functions: `paystack-initialize` (creates/loads the invoice, returns an authorization URL) and `paystack-webhook` (verifies the signature, records the transaction, marks the invoice paid, issues a receipt, writes the audit row, notifies the parent). Requires `PAYSTACK_SECRET_KEY`. Client only ever gets the checkout URL — no keys in the browser.

### 5. Admin finance tools (bursar-gated)
- Record a manual payment (cash/transfer) against an invoice, which issues the same receipt object
- Per-student discount entry: pick child, term, amount or percentage, reason; applied automatically to that term's invoice and to the receipt
- Invoice generation for a class or the whole school for a term
- Debtor list: who owes what, with a "send reminder" action
- Finance audit trail view: every fee, discount, invoice and receipt change with actor and timestamp

### 6. Templates and policy documents
- `Admin → Communication`: create and edit SMS/email templates for fee reminders, attendance alerts and announcements, with placeholder preview. Reminder sending uses the selected template.
- `Admin → Policies`: upload finance/records policy documents into a private bucket, versioned, attached to a category, visible from the fees area.

## Technical notes
- All new public tables get GRANTs, RLS, and policies: parents read only their linked children's invoices/receipts; students read their own; bursar admins get write; service role for webhook writes.
- Receipt serials: `IMS/RCP/<year>/<sequence>`; invoice serials `IMS/INV/<term>/<sequence>`, generated in a DB function so they never collide.
- Amounts stored in kobo-safe numeric; Paystack amounts multiplied by 100 at the edge, never in the UI.
- Reminder scheduling starts as an admin-triggered action; a cron job can be added once the templates settle.

## Order of work
1. Billing schema + invoice/discount generation
2. Parent dashboard money UI + invoice/receipt views
3. Paystack initialize + webhook
4. Admin: manual payments, discounts, debtors, audit view
5. Student dashboard design pass
6. Templates + policy documents

## Needed from you
- Paystack secret key (test key is fine to start)
- Bank details and the receipt wording/footer the school wants printed
- Whether invoices should be generated per term automatically at term start, or manually by the bursar
