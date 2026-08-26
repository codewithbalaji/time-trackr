# AI Agent Instructions

## Project

This repository contains a SaaS Time Tracking application built with React, TypeScript, Vite, and Supabase.

The application is initially being built for internal company use but should be architected so it can support multiple organizations and scale as a SaaS product.

See `docs/product.md` for target users, core product areas, and non-goals.

## Primary Goal

Build a maintainable, secure, scalable enterprise-style application while keeping the code understandable to a developer who is learning the architecture.

The AI agent must prioritize clarity, correctness, maintainability, and consistency over generating large amounts of code quickly.

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Lucide Icons

## Forms and Validation

- React Hook Form
- Zod

## Data

- Supabase
- PostgreSQL
- TanStack Query
- TanStack Table

## Notifications

- Sonner

## Charts

- Recharts

## Client State

- Zustand — use only for narrow, genuinely cross-component client state (e.g. an active timer). Prefer local component state and TanStack Query's server-state cache first; see "Do Not Over-Engineer".

## Date/Time

- date-fns
- @date-fns/tz — for organization/user timezone display; store and compute in UTC (see `docs/database.md`).

## Large Lists

- @tanstack/react-virtual — for virtualized rendering of large tables/lists where needed.

## Testing

- Vitest
- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)

---

# Core Development Principles

## 1. Understand Before Changing

Before modifying code:

1. Inspect the existing implementation.
2. Search for similar functionality.
3. Understand existing architecture.
4. Reuse existing code when appropriate.
5. Make the smallest reasonable change.

Do not rewrite unrelated code.

## 2. Do Not Over-Engineer

Do not introduce abstractions, libraries, design patterns, or folders unless they provide a real benefit.

Prefer simple and understandable solutions.

## 3. Do Not Duplicate Code

Reuse existing:

- Components
- Hooks
- Services
- Schemas
- Utilities
- Types

Do not create duplicate implementations of existing functionality.

## 4. Keep Responsibilities Separate

Components should primarily handle UI and user interaction.

Business/data operations should be handled by services or appropriate feature modules.

Validation should be handled by Zod schemas.

Reusable React behavior should be handled by hooks.

Infrastructure/configuration should be handled by `lib`.

---

# Folder Architecture

Use feature-based architecture combined with shared application infrastructure.

## Shared directories

- `src/app` - Application bootstrap, routing, and providers.
- `src/assets` - Static frontend assets.
- `src/components` - Shared reusable UI components.
- `src/features` - Business/domain features.
- `src/hooks` - Generic reusable React hooks.
- `src/layouts` - Shared page layouts.
- `src/lib` - Infrastructure and generic utilities.
- `src/pages` - Route-level screens when a page is not owned by a feature.
- `src/schemas` - Shared validation schemas.
- `src/services` - Shared application/data services.
- `src/test` - Shared test setup (test files are colocated with the code they test).
- `src/types` - Shared TypeScript types.

Feature-specific code should stay inside its feature whenever practical.

Example:

`src/features/time-tracking/`

may contain:

- `components`
- `hooks`
- `schemas`
- `services`
- `types`
- `pages`

Do not move feature-specific code into global folders without a reason.

See `docs/architecture.md` for full detail, including separation of responsibilities and feature ownership rules.

---

# React Rules

- Use functional components.
- Use TypeScript.
- Avoid `any`.
- Prefer explicit types for important boundaries.
- Keep components focused.
- Avoid very large components.
- Extract reusable logic into hooks.
- Avoid unnecessary global state.
- Prefer composition over deeply coupled components.

---

# TypeScript Rules

- Do not use `any` unless there is a documented technical reason.
- Prefer `unknown` when the type is genuinely unknown.
- Keep domain types explicit.
- Avoid duplicated type definitions.
- Reuse generated Supabase database types where appropriate.

---

# Forms

Use React Hook Form for non-trivial forms.

Use Zod for validation.

Do not duplicate validation rules across multiple places when the same business rule can be represented by one schema.

---

# Supabase Rules

- Use the Supabase client through the project's shared configuration.
- Never expose service-role or secret keys in frontend code.
- Never place secrets in `VITE_*` variables.
- Database changes must be made through migrations.
- Do not manually modify production database schema.
- Use Row Level Security for protected application data (see Security Rules below).

---

# Security Rules

- Never commit secrets.
- Never log passwords, tokens, API secrets, or sensitive credentials.
- Validate external input.
- Do not trust frontend-only authorization.
- Use database-level security for protected data.
- Follow the security rules defined in `docs/security.md`.

---

# UI Rules

Use the existing design system.

Prefer shared shadcn/ui components over creating duplicate primitives.

Do not introduce another UI library without a clear reason.

Use Sonner for application notifications.

Do not use browser `alert()` for normal application feedback.

Always account for:

- Loading states
- Empty states
- Error states
- Disabled states
- Validation states

---

# Database Rules

Follow the conventions in:

`docs/database.md`

Use migrations for database changes.

Consider:

- Relationships
- Foreign keys
- Constraints
- Indexes
- RLS
- Multi-tenancy

before creating database tables.

---

# Testing Rules

Before considering a meaningful feature complete:

1. Run TypeScript checks.
2. Run linting.
3. Run relevant tests.
4. Verify loading and error states.
5. Verify important edge cases.
6. Verify authorization/security implications.

See `docs/testing.md`.

---

# AI Working Process

For non-trivial tasks:

1. Inspect the repository.
2. Explain the current architecture if necessary.
3. Identify affected files.
4. Propose a concise implementation plan.
5. Implement only the requested scope.
6. Run relevant checks.
7. Summarize what changed.
8. Mention any risks or follow-up considerations.

Do not silently make architectural changes.

Do not create unrelated files.

Do not modify dependencies without explaining why they are needed.

---

# Phase Discipline

The project is being developed in phases.

Follow `docs/roadmap.md`.

Do not implement future-phase functionality unless explicitly requested.

For example:

- Authentication belongs to Phase 1.
- Organizations belong to Phase 2.
- Users/Employees belong to Phase 3.
- RBAC belongs to Phase 4.
- Time tracking belongs to a later phase.

Do not prematurely implement future features.

---

# Documentation

When an architectural decision changes, update the relevant documentation.

When a major architectural decision is made, consider adding an Architecture Decision Record under `docs/decisions/`, using `docs/decisions/template.md` as the starting point.

---

# Learning Mode

This project is also intended as a learning project.

When introducing a new important concept:

- Explain why it exists.
- Explain where it belongs.
- Explain the responsibility of the file.
- Avoid hiding significant architectural decisions behind generated code.

Do not optimize purely for speed of implementation.