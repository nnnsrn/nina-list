This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Setup

This app already uses Supabase through `lib/supabase.ts` and `lib/supabaseService.ts`. To connect it to your project:

1. Create a Supabase project.
2. Copy your project URL and anon public key from the Supabase dashboard.
3. Add them to a local env file named `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the SQL in `supabase_schema.sql` in the Supabase SQL editor.
5. Restart the Next.js dev server after saving the env file.

If those env vars are missing, the app falls back to local mock data in the browser.

## Admin Sign In

Set these variables in `.env.local` for the admin login flow:

```bash
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-admin-password
ADMIN_SESSION_SECRET=your-long-random-secret-at-least-32-characters
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The `/admin` route is protected and will redirect to `/signin` unless the signed session cookie is present. In production, `ADMIN_SESSION_SECRET` must be at least 32 characters so stale or weak admin sessions fail closed.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) for app typography.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Set these environment variables in Vercel before deploying production:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-admin-password
ADMIN_SESSION_SECRET=your-long-random-secret-at-least-32-characters
```

Do not commit `.env.local`; this repo ignores env files by default.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
