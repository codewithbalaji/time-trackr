# Contributing

Thanks for your interest in contributing to Time Trackr.

This project follows a specific set of architecture and coding conventions documented
in [`AGENTS.md`](./AGENTS.md) and the design system in [`DESIGN.md`](./DESIGN.md).
Please read both before opening a PR — they cover folder architecture and the UI's
visual language.

## Getting set up locally

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and point it at your **own local Supabase stack**
   (see [`docs/supabase-cli-workflow.md`](./docs/supabase-cli-workflow.md) for
   `supabase start`). Never point local development at the production project, and
   never commit `.env`.
3. Start the dev server:
   ```
   npm run dev
   ```

## Before opening a pull request

Run the following and make sure they all pass:

```
npm run lint
npm run build
npm run test
```

If your change touches database migrations or Row Level Security policies, also run:

```
npm run test:rls
```

For UI changes, check the result against [`DESIGN.md`](./DESIGN.md) (the "Quiet Ledger"
design system) and verify loading, empty, error, and disabled states.

## Workflow

- Open an issue first for anything beyond a small fix, so the approach and phase fit can
  be discussed before you invest time.
- Keep PRs focused — one logical change per PR.
- Write clear commit messages describing *why* a change was made, not just what changed.
- Reference the related issue in your PR description.

## Reporting bugs and requesting features

Use the GitHub issue templates. For security vulnerabilities, see
[`SECURITY.md`](./SECURITY.md) instead of opening a public issue.
