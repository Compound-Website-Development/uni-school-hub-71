# Full Functional & Design Specification (Documentation Only)

Goal: produce a single, exhaustive Markdown specification of the current app so another AI (Readdy AI / Google Stitch) can rebuild it without reading the source. No code changes, no new features — inspection and writing only.

## What gets produced

A new documentation file, `docs/FUNCTIONAL_SPEC.md`, containing all 15 requested sections:

1. Project overview — purpose, users, architecture, stack, Supabase, auth, storage, edge functions, integrations
2. Application structure — all 78 routes / ~76 page files, documented individually
3. User roles — student, teacher, admin (super admin), parent, plus public/unauthenticated access
4. User flows — landing → login → each portal, with ASCII diagrams (admission, attendance, grading, report cards, CBT, fees, parent ID login, QR verification, password reset)
5. Database — every table, column, FK, RLS policy, trigger, function, bucket, edge function
6. Features — purpose, pages, tables, permissions, edge cases, status
7. Component inventory — layouts, dialogs, wall, clock-in, QR scanner, report card editor, shadcn primitives
8. Design system — Sky Blue tokens from `index.css`/`tailwind.config.ts`, typography, radius, dark mode, breakpoints
9. Validation rules — as actually implemented in forms and DB
10. Business rules — grading bands, CA/exam weighting, promotion threshold, geofenced clock-in, parent ID/code, publish gating
11. Error analysis — broken/incomplete paths found during inspection, with severity, location, cause, suggested fix
12. Feature completeness matrix
13. Improvement opportunities
14. Design rebuild specification — screen-by-screen layout briefs for a design AI
15. Final summary — health scores, technical debt, priority order, effort estimate

## How the analysis is done

- Read every file under `src/pages`, `src/components`, `src/hooks`, `src/lib`, `src/integrations`
- Read `App.tsx` routing and each layout's navigation config to map routes → roles → nav entries
- Query the live Supabase schema (read-only) for exact columns, RLS policy expressions, grants, and row counts to confirm which tables are actually populated vs. empty
- Read `supabase/functions/*` (ai-assistant, mcp, parent-login, seed-admin) and `supabase/config.toml`
- Read `index.css` and `tailwind.config.ts` for the design tokens
- Load persisted security scan findings for the security section
- Optionally load the browser console/network snapshot to confirm runtime errors

Claims about current state (broken pages, empty tables, missing wiring) will only be included after being confirmed by a read or query — anything unverified is labelled as such.

## Output format

- One file: `docs/FUNCTIONAL_SPEC.md` (expected 3,000+ lines). If it grows unwieldy, it is split into `docs/spec/` parts with an index, but the default is a single file since the target tool ingests one document.
- Plain Markdown, ASCII diagrams for flows, tables for matrices, no emojis.

## Explicitly not doing

- No source file edits, no migrations, no dependency changes, no bug fixes — issues found are documented in section 11 only.
