
# Database Architecture and Conventions

## Database

The application uses PostgreSQL through Supabase.

Supabase provides:

- PostgreSQL
- Authentication
- Row Level Security
- Storage
- Database functions
- Edge Functions

---

## Database Rules

### Migrations

All schema changes must be made through database migrations.

Do not manually modify the production schema.

Migration files should be committed to source control.

---

## Naming

Use consistent naming conventions for:

- Tables
- Columns
- Foreign keys
- Indexes
- Constraints
- Functions

Prefer clear and descriptive names.

Database naming should remain consistent across the entire project.

---

## Primary Keys

Application tables should use stable primary keys.

Use UUIDs where appropriate for application entities.

---

## Relationships

Use explicit foreign keys.

Relationships should reflect real domain relationships.

Examples:

```text
organization
    |
    v
memberships
    |
    v
users
```

## Timestamps

Store database timestamps consistently.

Use UTC at the database level.

Display timestamps according to the user's or organization's timezone when required.

## Indexes

Add indexes when they are required for important query patterns.

Consider indexing:

- Foreign keys
- Organization identifiers
- Frequently filtered fields
- Frequently sorted fields
- Status fields where appropriate

Do not add unnecessary indexes without a reason.

## Constraints

Use database constraints when a rule must always be true.

Examples:

- `NOT NULL`
- `UNIQUE`
- `FOREIGN KEY`
- `CHECK` constraints

Do not rely entirely on frontend validation for database integrity.

## Row Level Security

RLS is a core security boundary.

Protected organization-owned data should use RLS policies.

Frontend authorization is not a replacement for RLS.

## Multi-Tenancy

The application is intended to support multiple organizations.

Organization-owned data should be associated with the correct organization.

Users should only be able to access data belonging to organizations for which they have valid membership/access.

## Supabase Types

When database schemas change, keep generated TypeScript database types synchronized with the actual schema.

Do not create duplicate manual representations of database types when generated types can be reused appropriately.

## Database Logic

Use database functions, triggers, or server-side logic when a rule belongs at the database level.

Avoid moving critical security rules entirely into frontend code.