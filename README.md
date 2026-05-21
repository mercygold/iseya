# ISEYA Resume Builder

ISEYA is a Next.js App Router resume builder and AI career assistant by Jormp LLC. It supports tailored resumes, cover letters, LinkedIn kits, application kits, PDF/DOCX exports, saved versions, source uploads, AI coaching, recruiter simulation, Supabase auth, and cloud resume persistence.

## Local Setup

Install dependencies:

```bash
npm install
```

Create environment variables:

```bash
cp .env.local.example .env.local
```

Add values to `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_URL=https://iseya.jormp.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_key
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_key
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` are server-only. Do not create `NEXT_PUBLIC_OPENAI_API_KEY`, and do not commit real keys.

Run the app:

```bash
npm run dev
```

Open the localhost URL shown in the terminal. Next.js will use another port if `3000` is occupied.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Confirm these tables exist:
   - `profiles`
   - `resumes`
   - `resume_versions`
   - `exports`
   - `subscriptions`
   - `ai_generations`
5. Confirm Row Level Security is enabled on each table.

The schema also creates private Storage buckets:

- `resumes`
- `exports`
- `profile-images`

If you prefer the Supabase dashboard, create those buckets manually under Storage and keep them private. Files should be stored under a user-id folder so the included Storage RLS policies can enforce ownership.

## Auth Testing

1. Add Supabase env vars to `.env.local`.
2. Restart `npm run dev`.
3. Visit `/signup` and create a test account.
4. Confirm the email if your Supabase project requires confirmation.
5. Visit `/login`, sign in, and confirm you are redirected to `/workspace`.
6. Visit `/dashboard`; it should redirect to `/workspace`.
7. Use `Forgot password` on `/login`; the reset email should route through `/auth/callback?next=/reset-password`.
8. Sign out from the account status in the ISEYA header.

Protected routes:

- `/workspace`
- `/dashboard`

Anonymous users can still use `/` with local browser persistence.

## Supabase Email Branding

Supabase controls the sender name and email template copy from the project dashboard. For production, update:

Supabase Dashboard -> Authentication -> Emails -> Templates

Recommended template updates:

- Sender or brand name: `Iseya`
- Confirm Signup subject: `Confirm your Iseya account`
- Reset Password subject: `Reset your Iseya password`
- Email copy should say `Iseya`, not `Supabase Auth`.

Auth redirects should be configured in Supabase Authentication URL settings:

- Site URL: `https://iseya.jormp.com`
- Redirect URLs:
  - `https://iseya.jormp.com/auth/callback`
  - `https://iseya.jormp.com/auth/callback?next=/workspace`
  - `https://iseya.jormp.com/auth/callback?next=/reset-password`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3001/auth/callback`

## Autosave Testing

1. Sign in.
2. Edit the master resume, target role, template, theme, or generated resume.
3. Wait for the autosave indicator to show the account save status.
4. Refresh `/workspace`; the latest cloud resume should load.
5. Click `Save Version`, then confirm a row appears in `resume_versions`.
6. Load or duplicate saved versions from the Saved Resume Versions panel.

Local fallback remains active when Supabase is not configured or when the user is signed out.

## Subscription Infrastructure

ISEYA has subscription scaffolding for:

- Starter / Free
- Plus / $1.99 one-time
- Pro Monthly / $7.99 per month
- Pro Annual / $69 per year

The `/pricing` page shows the planned plan structure. Stripe checkout and webhooks are not active yet, so no real payments are charged. Subscription profile fields are stored on `profiles`, and the app uses feature checks so Starter users keep basic resume editing and one resume download while paid plans can unlock more downloads, saved versions, AI credits, cover letters, LinkedIn kits, and application kits.

## Deployment To Vercel

1. Push the repository to GitHub.
2. Import it in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `OPENAI_API_KEY`
   - optional `OPENAI_MODEL`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Deploy.
5. Confirm `/login`, `/signup`, `/workspace`, `/api/tailor`, and `/api/extract` work in production.

## Validation

Run before deploying:

```bash
npm run lint
npm run build
```

## Security Notes

- Browser localStorage is convenient fallback storage, not secure storage for secrets.
- Uploaded source files are processed by the app backend extraction route.
- Supabase RLS uses `auth.uid()` ownership checks.
- The service-role key is available only for trusted server-side operations.
- Users should verify every generated resume claim before applying.
