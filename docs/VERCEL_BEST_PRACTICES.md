# Vercel Deployment Best Practices

This document outlines best practices for deploying the Winter Arc App on Vercel with Neon PostgreSQL and Stack Auth.

## 1. Deployment Workflow

### Git-Based Deployment

Vercel automatically deploys from your Git repository:

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | `app.winterarc.newrealm.de` |
| `develop` | Staging | `develop.winterarc.newrealm.de` |
| Feature branches | Preview | `*.vercel.app` |

### Deploy Commands

```bash
# Preview deployment (from any branch)
npm run deploy:preview

# Production deployment (main branch only)
npm run deploy

# Build locally first to catch errors
npm run build
```

### Preview Deployments

Every pull request automatically gets a preview deployment:
- Unique URL per PR
- Isolated from production data (use staging DB)
- Comments in PR with deployment URL

---

## 2. Environment Variables

### Required Variables

#### Stack Auth (Authentication)
```env
NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-publishable-key>
STACK_SECRET_SERVER_KEY=<your-secret-key>
```

#### Database (Neon PostgreSQL)
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@host/database?sslmode=require
```

### Variable Scopes

Configure different values per environment:

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `DATABASE_URL` | Production DB | Staging DB | Local/Staging |
| `STACK_*` | Production keys | Same or test keys | Test keys |

### Adding Variables in Vercel

1. Go to Project Settings > Environment Variables
2. Add variable with name and value
3. Select environments (Production, Preview, Development)
4. Click Save

**Security Notes:**
- Never commit secrets to Git
- Use `NEXT_PUBLIC_` prefix only for client-safe variables
- `STACK_SECRET_SERVER_KEY` must never be public

---

## 3. Performance Best Practices

### Data Caching with Revalidation

```typescript
// In API routes or server components
export const revalidate = 60; // Revalidate every 60 seconds

// Or use fetch with cache options
const data = await fetch(url, {
  next: { revalidate: 3600 } // Cache for 1 hour
});
```

### Static Generation

Prefer static generation where possible:

```typescript
// Generate static pages at build time
export async function generateStaticParams() {
  return [
    { slug: 'about' },
    { slug: 'privacy' },
  ];
}
```

### Image Optimization

Use Next.js Image component for automatic optimization:

```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Load above-the-fold images immediately
/>
```

### Edge Middleware

Use Edge Middleware for fast, global operations:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  // A/B testing, geo-routing, auth checks
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

## 4. Security

### HTTPS

- Automatically enabled on all Vercel deployments
- No configuration needed
- Includes automatic certificate renewal

### Headers

Configure security headers in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Stack Auth Domain Whitelisting

In Stack Auth dashboard, whitelist all deployment domains:

```
# Development
localhost:3000

# Production
app.winterarc.newrealm.de

# Vercel Previews (use wildcard)
*.vercel.app
```

---

## 5. Stack Auth + Neon Integration

### Neon Auth Tab Configuration

If using Neon's built-in auth:
1. Go to Neon Dashboard > Auth tab
2. Connect Stack Auth provider
3. Configure role mappings

### Role Setup

```sql
-- In Neon SQL Editor
CREATE ROLE app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

### Connection Pooling

Use pooled connections for serverless:
- `DATABASE_URL` - Pooled (for app queries)
- `DATABASE_URL_UNPOOLED` - Direct (for migrations)

```typescript
// lib/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

---

## 6. Monitoring & Analytics

### Vercel Analytics

Already configured in `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// In layout
<Analytics />
<SpeedInsights />
```

### Sentry Integration

For error tracking:

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

---

## 7. Build Optimization

### Analyze Bundle Size

```bash
# Generate bundle analysis
ANALYZE=true npm run build
```

### Reduce Cold Starts

- Keep API routes small and focused
- Use dynamic imports for large components
- Consider Edge Runtime for simple routes

```typescript
// Use Edge Runtime for faster cold starts
export const runtime = 'edge';

export async function GET() {
  return Response.json({ status: 'ok' });
}
```

---

## 8. Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check types locally first
npm run typecheck

# Check for lint errors
npm run lint
```

#### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check Neon dashboard for connection limits
- Use pooled connection for serverless

#### Auth Redirect Issues
- Verify domains in Stack Auth dashboard
- Check `NEXT_PUBLIC_STACK_*` variables are set
- Ensure handler route exists at `/handler/[...stack]`

### Useful Commands

```bash
# View Vercel logs
vercel logs

# View deployment details
vercel inspect <deployment-url>

# Rollback to previous deployment
vercel rollback
```

---

## 9. Checklist for Production

- [ ] All environment variables set in Vercel
- [ ] Stack Auth domains whitelisted
- [ ] Database migrations applied
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Analytics enabled
- [ ] Error tracking configured
- [ ] Build passes locally
- [ ] Tests pass

---

## 10. Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Stack Auth Documentation](https://docs.stack-auth.com)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Neon + Stack Auth + Vercel Guide](https://neon.com/blog/build-internal-tools-neon-stackauth-vercel)
