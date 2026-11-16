# Imagemakers Nursery and Primary School Portal

_Imparting Wisdom and Morals._

A school management portal with four role-based areas: Administration, Staff, Student and Parent.

## Features

- **Admin** — students, staff, admissions, fees, reports, library, transport, certificates, analytics
- **Staff** — gradebook, attendance, assignments, lesson plans, CBT exams, messaging
- **Student** — grades, transcript, schedule, attendance, fees, homework, exams
- **Parent** — child grades, attendance, fees, messages

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Postgres with row-level security, auth, storage and edge functions

## Getting started

```sh
npm install
npm run dev
```

The app runs on http://localhost:8080.

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start the development server   |
| `npm run build`   | Production build               |
| `npm run preview` | Preview the production build   |
| `npm run lint`    | Lint the codebase              |

## Environment

Backend credentials are read from `.env` (publishable keys only). Server-side secrets are configured in the backend project, never committed.
