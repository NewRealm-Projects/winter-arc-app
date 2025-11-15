# Winter Arc Development Guidelines

## Environment Configuration

Copy the provided template to create your local environment file:

```bash
cp .env.local.template .env.local
```

The template mirrors `.env.example` and includes the variables required for the Next.js stack:

- `DATABASE_URL` – Neon/Vercel Postgres connection string
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL` – NextAuth configuration
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` – Google OAuth credentials

Optional integrations such as Gemini and Sentry are also documented in the template. Refer to [`docs/archive/firebase-env.md`](archive/firebase-env.md) if you still support the legacy Firebase backend.

After populating `.env.local`, start the development server with `pnpm dev`.
