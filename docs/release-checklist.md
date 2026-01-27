# Release Checklist

Use this checklist before deploying a new version of Winter Arc Tracker.

## Pre-Release Testing

### Functionality
- [ ] Login with Stack Auth works
- [ ] Onboarding flow completes successfully
- [ ] Dashboard loads and displays user data
- [ ] Tracking page saves data to database
- [ ] Leaderboard shows group members correctly
- [ ] Settings page allows profile updates
- [ ] Logout works and clears state

### Data Persistence
- [ ] Tracking data syncs to PostgreSQL
- [ ] No data loss on page refresh
- [ ] User preferences persist

### Cross-Browser Testing
- [ ] Chrome/Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Responsive Design
- [ ] Mobile (320px - 480px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1280px+)
- [ ] PWA install prompt works on mobile

### Light/Dark Mode
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] System preference auto-detected
- [ ] Background images load in both modes

### Performance
- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 90 (SEO)
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s

## Security & Privacy

### Database Security
- [ ] API routes validate authentication
- [ ] Database queries use parameterized statements
- [ ] CORS configured correctly

### Data Protection
- [ ] No sensitive data logged to console (production build)
- [ ] User data encrypted in transit (HTTPS)
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Account deletion works and removes all user data

## PWA Configuration

### Manifest
- [ ] App name correct
- [ ] Short name < 12 characters
- [ ] Icons present (512x512, 192x192)
- [ ] Theme color matches brand
- [ ] Background color set
- [ ] Display mode is `standalone`

### Service Worker
- [ ] Service worker registers successfully
- [ ] Offline page loads when network unavailable
- [ ] Assets cached correctly
- [ ] Cache invalidation works on updates

### Install Prompt
- [ ] Install prompt appears on supported browsers
- [ ] App installs to home screen (iOS)
- [ ] App installs to desktop/app drawer (Android)
- [ ] Splash screen displays correctly

## Environment Configuration

### Production Environment Variables
- [ ] `DATABASE_URL` set
- [ ] `NEXT_PUBLIC_STACK_PROJECT_ID` set
- [ ] `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` set
- [ ] `STACK_SECRET_SERVER_KEY` set

### Vercel
- [ ] All environment variables configured
- [ ] Production domain configured
- [ ] Preview deployments working

## Code Quality

### Automated Checks
- [ ] `npm run test` passes
- [ ] `npm run typecheck` passes (if available)
- [ ] `npm run lint` passes
- [ ] No console errors in production build
- [ ] No TypeScript errors

### Code Review
- [ ] All PRs reviewed and approved
- [ ] No TODO comments left in critical code
- [ ] No commented-out code blocks
- [ ] No debug code (console.log, debugger)

## Build & Deployment

### Build Process
- [ ] Production build completes without errors
  ```bash
  npm run build
  ```
- [ ] Bundle size is reasonable

### Deployment
- [ ] Deploy to preview environment first
- [ ] Test preview environment thoroughly
- [ ] Deploy to production via Vercel
- [ ] Verify production deployment

### Post-Deployment
- [ ] Production app loads successfully
- [ ] No errors in browser console
- [ ] No errors in Sentry/error tracking
- [ ] Monitor initial user sessions

## Documentation

- [ ] CHANGELOG.md updated with new features/fixes
- [ ] README.md reflects current features
- [ ] CLAUDE.md updated if architecture changed

## Rollback Plan

### If Issues Arise
- [ ] Rollback via Vercel dashboard
- [ ] Previous version tagged in git
- [ ] Database migrations are reversible (if applicable)

### Monitoring
- [ ] Sentry error tracking active
- [ ] User feedback channel available

## Accessibility (A11y) Quick Scan

- [ ] All images have alt text
- [ ] Interactive elements keyboard-accessible
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader friendly (test with VoiceOver/NVDA)
- [ ] No flashing/strobing content
- [ ] Focus indicators visible

---

## Version Information

**Version**: _____
**Release Date**: _____
**Released By**: _____
**Git Tag**: _____

## Sign-Off

- [ ] Tech Lead approval
- [ ] QA approval

---

**Notes**:
