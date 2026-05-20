# Iseya Resume Agent

Iseya is a Next.js resume builder and AI career assistant. It supports resume tailoring, cover letters, PDF/DOCX exports, saved local resume versions, upload-based source materials, AI coaching, recruiter simulation, LinkedIn optimization, and application kit generation.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.local.example .env.local
```

Add your server-only OpenAI key:

```bash
OPENAI_API_KEY=your_key_here
```

Do not prefix the OpenAI key with `NEXT_PUBLIC_`. The key is used only by `app/api/tailor/route.ts`.

Optional Supabase project configuration for future account/cloud-save work:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

Open the localhost URL shown in the terminal. If port `3000` is already occupied, Next.js will choose the next available port.

## Validation

Before deploying, run:

```bash
npm run lint
npm run build
```

## Supabase Preparation

This phase adds Supabase-ready structure without requiring login:

- `lib/supabaseClient.ts` reads browser-safe Supabase env vars.
- `lib/supabaseServer.ts` prepares server-side Supabase REST configuration.
- `supabase/schema.sql` defines `profiles`, `resume_versions`, `uploaded_sources`, and `usage_events` with basic RLS policies.

When Supabase is not configured, the app continues using localStorage for drafts, saved versions, uploads metadata, and usage counters.

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `OPENAI_API_KEY`
   - Optional: `OPENAI_MODEL`
   - Optional: `NEXT_PUBLIC_SUPABASE_URL`
   - Optional: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Confirm the production deployment can run `/api/tailor` and `/api/extract`.

## Security Notes

- `.env.local` and other `.env*` files are ignored by git.
- `OPENAI_API_KEY` must remain server-only.
- Do not create `NEXT_PUBLIC_OPENAI_API_KEY`.
- Uploaded files are sent only to the app's backend extraction route, `/api/extract`.
- Browser localStorage is convenient for MVP persistence but is not secure storage for secrets or sensitive documents.
- Supabase RLS policies in `supabase/schema.sql` are intentionally basic and should be reviewed before production launch.

## Usage Limits

Local usage tracking currently counts:

- AI generations used today
- Exports created
- Saved resume versions

These counters are stored in localStorage for anonymous users. The `usage_events` table is prepared for future authenticated tracking and paid-plan enforcement. Stripe is not implemented in this phase.
