# Time Trackr

A SaaS-oriented time tracking application designed to replace spreadsheet-based employee time tracking.

The application is initially intended for internal company use, but the architecture is designed to support multiple organizations and future SaaS expansion.

---

## Objectives

The application provides a centralized system for:

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
- Lucide Icons

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
└── testing.md

supabase/
├── migrations/
├── functions/
└── seed/
```

---

## Environment Variables

Create a `.env` file at the project root using `.env.example` as a template:

```bash
cp .env.example .env
```

### Required Variables

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

### Optional Variables

```env
VITE_SENTRY_DSN= # enables error tracking in production builds (see docs/deployment.md)
```

> [!WARNING]
> Never commit `.env` or expose service-role / secret keys in frontend code.

The Supabase project referenced in the team's shared config is production (see [`docs/decisions/0010-phase13-production-readiness.md`](./docs/decisions/0010-phase13-production-readiness.md)) — point your local `.env` at your own local Supabase stack instead ([`docs/supabase-cli-workflow.md`](./docs/supabase-cli-workflow.md)'s `supabase start`), not the production URL/keys.

---

## Development

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Setup & Commands

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run database / RLS tests:

```bash
npm run test:rls
```

Run the production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## Development Philosophy

The project is intentionally developed in phases. Features should be implemented incrementally rather than generating the entire application at once.

The goal is to maintain:

- Clear architecture
- Understandable code
- Strong security
- Consistent UI
- Testable features
- Maintainable database design

---

## Documentation

- [`docs/product.md`](./docs/product.md) – Target users, core product areas, and non-goals
- [`docs/architecture.md`](./docs/architecture.md) – Architecture overview, separation of concerns, and feature ownership
- [`docs/database.md`](./docs/database.md) – Database schema, multi-tenancy, and RLS policies
- [`docs/security.md`](./docs/security.md) – Security model and authorization rules
- [`docs/design-system.md`](./docs/design-system.md) / [`DESIGN.md`](./DESIGN.md) – Design system and UI guidelines
- [`docs/testing.md`](./docs/testing.md) – Testing strategy and guidelines
- [`docs/deployment.md`](./docs/deployment.md) – Production build, deployment, and Sentry configuration
- [`docs/supabase-cli-workflow.md`](./docs/supabase-cli-workflow.md) – Local Supabase workflow and migration guide

---

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`AGENTS.md`](./AGENTS.md) before opening a PR — they cover local setup, required checks, and the project's phase-based development approach. Bug reports and feature requests should use the GitHub issue templates; security issues should be reported privately per [`SECURITY.md`](./SECURITY.md).

---

## License

This project is licensed under the [MIT License](./LICENSE).
