# Winter Arc – Development Guidelines (Clean Version)

**Version:** 2.3
**Last Updated:** 2025-10-01
**Project:** Winter Arc Fitness Tracker

---

## 📑 Meta Rules (Read First)

1. **Check FIXES.md first** – never re-solve known bugs.
2. **Document everything** – new requirements go in CLAUDE.md, fixes in FIXES.md.
3. **Always verify implementation** – don’t mark features “done” until manually tested.

---

## 📝 Project Overview

Cross-platform fitness tracker built with **Expo + React Native + TypeScript**, deployed on **Web, iOS, Android**.

### Features

* Push-ups, Sport, Protein, Water, Weight tracking
* HomeScreen with inline logging + quick-add buttons
* Interactive Weight Graph (7–30 days, dual line with body fat)
* Leaderboard with group codes + points
* Theme support (light/dark/auto)
* Settings (profile, theme, notifications)

### Tech Stack

* **Framework:** Expo + React Native
* **Backend:** Firebase (Auth + Firestore)
* **Auth:** Google OAuth
* **Navigation:** React Navigation (modals)
* **Deployment:** GitHub Pages (Actions)
* **State:** React Context
* **Security:** Socket.dev, Firebase Rules, App Check

---

## ⚙️ Setup & Commands

```bash
# Install
npm install

# Run
npm start          # Dev server
npm run web        # Web
npm run android    # Android
npm run ios        # iOS (macOS)

# Build / Deploy
npm run build:web
npm run deploy

# Quality
npm test
npm run lint
npm run type-check
```

### Environment Checklist

* Node.js 18+
* Firebase project + credentials in `.env`
* Google OAuth configured
* GitHub repo + secrets set up

---

## 📂 Project Structure

```
src/
├── components/   # UI
│   ├── AnimatedGradient.tsx
│   ├── GlassButton.tsx
│   ├── GlassCard.tsx
│   ├── WeeklyOverview.tsx
│   └── WeightGraph.tsx
├── contexts/     # Auth + Theme
├── screens/      # Login, Onboarding, Home, Weight, Leaderboard, Settings
├── services/     # firebase.ts, database.ts, notifications.ts
└── types/
```

**Deprecated Screens:** PushUps, Water, Sport, Protein, Nutrition → all replaced by inline logging.

---

## 🔑 Key Requirements

### Logging System

* Quick-add modals (not full screens)
* One-tap logging + auto-close
* Inline display of last 3–5 entries
* Edit/Delete with instant UI update

### Weight Tracker

* Inline mini-graph (7–14 days)
* Dual line: weight (purple) + body fat (gold)
* Detailed 30-day modal with BMI + trends
* Last known body fat persists if not updated

### Leaderboard

* Group ranking via groupCode
* Points: Sport×10, Push-ups×1, Protein÷10, Water÷1000
* Medals for 🥇🥈🥉

### Design

* Apple-inspired **Liquid Glass** (blur + gradient)
* Glass layers: Background, Cards, Modals, Buttons
* Consistent iOS typography + spacing grid

---

## 🔒 Security

* **Socket.dev** scans dependencies via GitHub Actions
* **Firebase Rules**:

  * Auth required
  * Users only see their own data
  * Validation: Push-ups 1–1000, Water 1–5000ml, Protein 1–500g, Weight 1–500kg, Body fat 3–50%
* **App Check (Web)** with reCAPTCHA v3
* Best Practices: rotate keys, 2FA, no `.env` commits

---

## 🧑‍💻 Coding Standards

* TypeScript strict typing
* Components: PascalCase
* Variables/functions: camelCase
* Constants: UPPER_SNAKE_CASE
* Errors must be handled (no empty catch)
* Memoize expensive operations
* Use React.memo for glass components

---

## 🛠️ Troubleshooting (Quick Reference)

* **Entries not showing:** Call `loadAllData()` after writes
* **Weight graph empty:** need ≥1 datapoint, check filters
* **Theme not applied:** verify ThemeProvider wraps Navigation
* **WeeklyOverview blank:** check date aggregation logic
* **Build fails:** clear cache + run `npm run type-check`
* **Deployment fails:** verify GitHub secrets + homepage in package.json

---

## ✅ Testing Checklist

* [ ] Quick-add logging works for all categories
* [ ] Entries update instantly on HomeScreen
* [ ] Weight graph shows 14 days + opens 30-day modal
* [ ] Leaderboard ranks correctly with medals
* [ ] Theme toggles light/dark/auto
* [ ] Firebase rules block invalid/foreign access
* [ ] App Check active (web)

---

## 🚀 Development Workflow

1. **Branching**: `feature/<name>`
2. **Implement**: strong typing, handle errors, follow standards
3. **Test**: manual edge cases, dark mode, multiple devices
4. **Document**: update CLAUDE.md + add JSDoc
5. **Deploy**: push, check Actions, run `npm run build:web`

### Commit Format

```
feat(tracking): add inline edit for push-ups
fix(auth): block HomeScreen before onboarding
refactor(theme): centralize color constants
```

---

## 🔮 Roadmap

### Priority 1

* Habit streaks
* Custom goals
* Photo logging
* Export data (CSV/JSON)
* Weekly reports via email

### Priority 2

* Social features (likes/comments)
* Challenges & badges
* Meal tracking

### Priority 3

* AI coach
* Wearable sync
* Nutrition DB
* Voice logging

---

## 📜 Changelog

### 2.3 (2025-10-01)

* Cleaned + restructured CLAUDE.md
* Updated design system to iOS Liquid Glass
* Hardened weight graph rendering

### 2.0 (2025-10-01)

* Full restructure of documentation
* Added standards, workflow, API ref

### 1.x

* Initial setup, Firebase + core features
* Glassmorphism baseline

---

**Maintained by:** Winter Arc Dev Team
**Questions:** open GitHub issue