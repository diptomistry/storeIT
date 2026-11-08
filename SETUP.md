# Store It Setup Guide

## 1. Supabase

1. Create a Supabase project.
2. Copy **Project URL**, **anon/public key**, and **service_role key** into `.env.local`.
3. In **Authentication → Providers**, enable Email.
4. In **Authentication → URL configuration**, set:
   - Site URL: `http://localhost:3000` (or your production URL)
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback`
5. Open the SQL editor and run migrations in order:
   1. `supabase/migrations/20241108000000_initial_schema.sql`
   2. `supabase/migrations/20241108000001_storage_helpers.sql`
6. Confirm tables exist: `profiles`, `folders`, `files`, `user_storage_usage`, `upload_sessions`.
7. Confirm RLS is enabled on those tables.

Optional: disable “Confirm email” only for local development if you want instant login after register.

## 2. Cloudflare R2

1. Create an R2 bucket (keep it **private**).
2. Create an API token with Object Read & Write permissions for that bucket.
3. Set:

```env
CLOUDFLARE_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

4. Configure CORS on the bucket so browser PUT uploads work from your app origin:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 3. Application env

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Local-only login bypass
DEV_MODE=false
NEXT_PUBLIC_DEV_MODE=false
DEV_BYPASS_SECRET=
```

Never commit `.env.local`. Never expose `SUPABASE_SERVICE_ROLE_KEY` or R2 secrets to the browser.

### Dev login bypass

For local development only:

```env
DEV_MODE=true
NEXT_PUBLIC_DEV_MODE=true
DEV_BYPASS_SECRET=fffftttt
```

Then open `/login` and use **Bypass login**, or visit:

`http://localhost:3000/login?bypass=fffftttt`

This creates a confirmed `dev@storeit.local` user and starts a real session. Keep `DEV_MODE=false` in production.

## 4. Vercel deployment

1. Push the repository and import it into Vercel.
2. Add the same environment variables in the Vercel project settings.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL.
4. Update Supabase redirect URLs and R2 CORS for the production domain.
5. Redeploy.

## 5. Verify

After setup:

1. Register a user and confirm email (if enabled).
2. Upload a file and confirm the object appears in R2.
3. Download via the app (presigned GET).
4. Soft-delete, restore, then permanently delete and confirm quota updates.
5. Sign in as a second user and confirm files from user A are not visible.

## Architecture notes

- PostgreSQL stores metadata only.
- R2 stores binary objects under opaque keys: `users/<userId>/<yyyy>/<mm>/<uuid>`.
- Upload flow: init → reserve quota → presign PUT → client upload → complete + HeadObject verify → insert `files` row → release reservation.
- Soft-deleted files still count against quota until permanently deleted.
