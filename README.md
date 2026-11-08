# Store It

Modern cloud file storage platform built with Next.js, Supabase Auth/PostgreSQL, and Cloudflare R2.

## Features

- Email/password authentication with verification and password reset
- Nested folders with cycle-safe moves
- Direct-to-R2 uploads via short-lived presigned URLs
- Soft delete / restore / permanent delete with storage accounting
- Search, sort, star, recent, trash
- Image / PDF / text previews
- Storage quota enforcement (default 1 GB)
- Row Level Security on all user-owned tables

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase Auth + PostgreSQL
- Cloudflare R2 (S3-compatible) via AWS SDK v3

## Quick start

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Fill in Supabase and R2 values (see [SETUP.md](./SETUP.md)).

3. Apply SQL migrations in the Supabase SQL editor (in order):

- `supabase/migrations/20241108000000_initial_schema.sql`
- `supabase/migrations/20241108000001_storage_helpers.sql`

4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run unit tests |

## Security notes

- Service role and R2 secrets are server-only.
- Upload completion verifies object size with R2 `HeadObject` before inserting metadata.
- Ownership is always taken from the authenticated session, never from client-supplied user IDs.
- Do not claim production readiness until you have run security testing against your deployed environment.

## Project layout

See `app/`, `components/`, `lib/`, and `supabase/migrations/` for the main application structure.
