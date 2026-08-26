# Design System

## Goal

Provide a consistent, accessible, professional enterprise UI across the application.

For concrete tokens — colors, typography, spacing, radius, and component visual specs — see `DESIGN.md` at the project root. This file covers behavior and rules; `DESIGN.md` covers the actual values.

---

## UI Stack

Use:

- Tailwind CSS
- shadcn/ui
- Lucide icons
- Sonner for notifications

Do not introduce another UI component library without a clear reason.

---

## Component Reuse

Prefer existing shared components.

Before creating a new UI primitive, check whether an existing component can be reused.

Examples:

- Button
- Input
- Select
- Dialog
- Dropdown
- Table
- Tooltip
- Tabs

---

## Layout

The application should use a consistent application shell.

Typical structure:

```text
┌──────────────────────────────────┐
│ Header                           │
├────────────┬─────────────────────┤
│ Sidebar    │ Main Content        │
│            │                     │
│            │                     │
└────────────┴─────────────────────┘
```

### Forms

Forms should:

- Have clear labels.
- Show validation errors.
- Show loading/submitting states.
- Disable appropriate controls during submission.
- Preserve consistent spacing.
- Clearly identify required fields.

Use React Hook Form and Zod.

### Tables

Enterprise tables should consider:

- Search
- Filtering
- Sorting
- Pagination
- Loading states
- Empty states
- Error states
- Row actions
- Responsive behavior

Use server-side pagination for sufficiently large datasets.

### Notifications

Use Sonner for temporary application notifications.

Examples:

- Successful save
- Successful deletion
- Failed operation
- Important status updates

Do not use browser `alert()` for normal feedback.

### Loading States

Use clear loading indicators.

Avoid blank screens during asynchronous operations.

### Empty States

Every data-heavy screen should consider what happens when there is no data.

Example:

No time entries found.

Start tracking time to see your entries here.

### Error States

Errors should:

- Be understandable
- Avoid exposing sensitive technical information
- Provide a useful recovery action when possible

### Destructive Actions

Destructive actions should require appropriate confirmation.

Examples:

- Delete project
- Remove organization member
- Delete time entry

### Accessibility

UI should consider:

- Keyboard navigation
- Visible focus
- Appropriate labels
- Semantic HTML
- Accessible dialogs
- Accessible forms
- Sufficient contrast

### Responsive Design

The application should remain usable across supported screen sizes.

Prioritize the desktop enterprise workflow while maintaining reasonable support for smaller screens.

### Consistency

The same interaction should look and behave consistently across the application.

Do not invent new interaction patterns for individual pages without a reason.