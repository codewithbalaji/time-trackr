# Security Rules

## Security Principle

Never assume that the frontend is a trusted environment.

Frontend checks improve user experience.

Database and server-side controls enforce security.

---

# Authentication

Use Supabase Auth for user authentication.

Authentication answers:

> Who is this user?

Authentication is different from authorization.

---

# Authorization

Authorization answers:

> What is this user allowed to do?

Authorization will eventually be implemented through:

- User membership
- Roles
- Permissions
- Database RLS policies

---

# Row Level Security

RLS should protect sensitive application data.

Do not rely on React route guards alone to protect database data.

---

# Secrets

Never commit:

- Passwords
- API secrets
- Service-role keys
- Private tokens
- Database credentials

Never expose Supabase service-role/secret credentials in frontend code.

Do not put secrets into `VITE_*` environment variables.

---

# Environment Variables

Frontend environment variables are potentially visible to browser code.

Only values intended for public/client-side use should be exposed through Vite.

Keep secrets on trusted server-side environments.

---

# Input Validation

Validate user input using Zod where appropriate.

Do not assume frontend validation alone is sufficient.

Database constraints should protect critical data integrity.

---

# Authorization Checks

Every sensitive operation should have an appropriate authorization boundary.

Examples:

- User can edit only their permitted records.
- Managers can access only data they are authorized to view.
- Organization data must not leak across tenants.
- Administrative operations must require appropriate permissions.

---

# Logging

Never log:

- Passwords
- Access tokens
- Refresh tokens
- Service-role keys
- API secrets
- Sensitive authentication data

Logs should contain enough information for debugging without exposing secrets.

---

# File Uploads

When file uploads are introduced:

- Validate file type.
- Validate file size.
- Use appropriate storage permissions.
- Do not trust client-provided metadata.

---

# Security Reviews

When adding a feature, consider:

1. Who can access it?
2. What data can they read?
3. What data can they modify?
4. What data can they delete?
5. What happens across organizations?
6. Does RLS enforce the intended access?
7. Could the frontend bypass the intended rules?