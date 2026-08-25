# Application Architecture

## Architectural Approach

The application uses a feature-based architecture combined with shared application infrastructure.

The primary organizational principle is:

> Group code by business responsibility and ownership.

Do not organize the application only by technical file type.

---

## High-Level Structure

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
└── types/
```

### `app/`

Contains application bootstrap and global application configuration.

Examples:

- Application root
- Router
- Providers
- Global configuration

Example:

```text
app/
├── App.tsx
├── router.tsx
└── providers/
```

### `components/`

Contains reusable UI components shared across multiple features.

Examples:

- Button
- Dialog
- Input
- Table
- EmptyState
- LoadingState
- ErrorState

Feature-specific components should normally remain inside the owning feature.

### `features/`

Contains business domains of the application.

Expected features include:

```text
features/
├── auth/
├── organizations/
├── users/
├── clients/
├── projects/
├── time-tracking/
├── timesheets/
├── approvals/
├── reports/
└── settings/
```

A feature can contain:

- `components/`
- `hooks/`
- `pages/`
- `schemas/`
- `services/`
- `types/`

Only create subdirectories that are actually needed.

### `hooks/`

Contains generic reusable React hooks.

A hook belongs here when it is genuinely shared and not tied to a specific business domain.

Examples:

- `useDebounce`
- `useMediaQuery`

Feature-specific hooks should stay in the relevant feature.

### `layouts/`

Contains reusable page layouts.

Examples:

- Authentication layout
- Dashboard layout
- Admin layout

Layouts provide shared page structure rather than business logic.

### `lib/`

Contains infrastructure and generic utilities.

Examples:

- Supabase client
- Generic utility functions
- Constants
- Configuration

Avoid putting business-specific logic in generic utility files.

### `pages/`

Contains route-level screens that are not better owned by a specific feature.

A page represents a screen or route composition.

For example:

- `/login`
- `/dashboard`
- `/settings`

A page may compose components from one or more features.

### `schemas/`

Contains globally shared validation schemas.

Feature-specific schemas should remain inside the feature.

Use Zod for validation.

### `services/`

Contains globally shared application/data services.

Feature-specific services should normally remain inside the corresponding feature.

### `types/`

Contains shared TypeScript types.

Feature-specific types should remain inside the relevant feature.

## Separation of Responsibilities

The preferred flow is:

```text
Page
  ↓
Feature Component
  ↓
Hook
  ↓
Service
  ↓
Supabase Client
  ↓
PostgreSQL
```

Validation flow:

```text
Form
  ↓
React Hook Form
  ↓
Zod
  ↓
Service
```

## Component Responsibility

Components should primarily handle:

- Rendering
- User interaction
- UI state
- Calling hooks

Avoid putting large database queries or complex business rules directly inside components.

## Feature Ownership

A file should normally live close to the feature that owns it.

Example:

`features/time-tracking/components/Timer.tsx`

Rather than:

`components/Timer.tsx`

unless the Timer is genuinely shared across multiple unrelated features.

## Growth Principle

Do not create folders simply because the architecture diagram contains them.

Create abstractions and directories when there is actual responsibility to organize.

Avoid premature complexity.