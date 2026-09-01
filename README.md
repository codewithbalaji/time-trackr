# Time Tracker

A SaaS-oriented time tracking application designed to replace spreadsheet-based employee time tracking.

The application is initially intended for internal company use, but the architecture is designed to support multiple organizations and future SaaS expansion.

---

## Objectives

The application should provide a centralized system for:

- Employee time tracking
- Projects
- Timesheets
- Approvals
- Reports
- User management
- Organization management
- Role-based access control
- Auditability

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router

### UI

- Tailwind CSS
- shadcn/ui
- Lucide

### Forms

- React Hook Form
- Zod

### Backend

- Supabase
- PostgreSQL
- Supabase Auth

### Data Management

- TanStack Query
- TanStack Table
- TanStack Virtual (large lists/tables)

### Date/Time

- date-fns
- @date-fns/tz

### Notifications

- Sonner

### Charts

- Recharts

### Client State

- Zustand (narrow, cross-component client state only)

### Testing

- Vitest
- Testing Library

---

## Project Structure

```text
src/
├── app/
├── assets/
├── components/
├── features/
├── hooks/
├── layouts/
├── lib/
├── pages/
├── schemas/
├── services/
├── test/
└── types/

docs/
├── product.md
├── architecture.md
├── database.md
├── security.md
├── design-system.md
├── testing.md
└── roadmap.md

supabase/
├── migrations/
├── functions/
└── seed/

Environment Variables

Create a .env file at the project root.

Required variables:

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

Optional:

VITE_SENTRY_DSN= (enables error tracking in production builds — see docs/deployment.md)

Never commit .env.

Use .env.example as the template for required environment variables.

The Supabase project referenced in the team's shared config is production (see
docs/decisions/0010-phase13-production-readiness.md) — point your local .env at
your own local Supabase stack instead (docs/supabase-cli-workflow.md's
`supabase start`), not the production URL/keys.

Development

Install dependencies:

npm install

Start the development server:

npm run dev

Run linting:

npm run lint

Run the production build:

npm run build

Run tests:

npm run test

Run tests in watch mode:

npm run test:watch
Development Philosophy

The project is intentionally developed in phases.

Features should be implemented incrementally rather than generating the entire application at once.

The goal is to maintain:

Clear architecture
Understandable code
Strong security
Consistent UI
Testable features
Maintainable database design