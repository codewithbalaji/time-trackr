# Testing Strategy

## Goal

Build confidence that the application works correctly and that important functionality does not regress.

Testing should focus on business-critical behavior rather than achieving an arbitrary percentage.

## File Location

Colocate test files next to the code they test (e.g. `Button.tsx` and `Button.test.tsx` in the same folder).

Shared test setup (e.g. Testing Library/jsdom setup) lives in `src/test/`.

## Testing Levels

## Unit Tests

Use unit tests for isolated logic.

Examples:

- Utility functions
- Business calculations
- Validation logic

## Component Tests

Use component tests for important UI behavior.

Examples:

- Form validation
- Button interactions
- Error rendering
- Loading states

## Integration Tests

Use integration tests for workflows involving multiple parts of the application.

Examples:

- Login workflow
- Time entry creation
- Timesheet submission
- Approval workflow

## Database and Security Tests

Important database and authorization behavior should be tested.

Especially:

- RLS policies
- Organization isolation
- Role-based access
- Permission boundaries

## End-to-End Tests

Use end-to-end tests for critical user journeys when the application reaches sufficient maturity.

Examples:

```text
Login
  |
Dashboard
  |
Start timer
  |
Stop timer
  |
Submit timesheet
```

## Required States

- Success
- Loading
- Empty
- Error
- Validation failure
- Unauthorized access
- Not found

## Definition of Tested

A feature should not be considered complete merely because it works in the happy path.

Important edge cases should also be considered.

## Before Finishing a Feature

Run:

- TypeScript checks
- ESLint
- Relevant unit/component tests
- Relevant integration tests
- Security/authorization checks where applicable

## Test Philosophy

Prefer meaningful tests over tests that simply increase coverage numbers.

Focus on:

- User behavior
- Business rules
- Security boundaries
- Important edge cases