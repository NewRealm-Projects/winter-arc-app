# CODEX.md

Guidance for GitHub Copilot / ChatGPT Codex style agents working inside the **Winter Arc Fitness Tracker** repository. These
instructions mirror the expectations outlined in `CLAUDE.md` while translating them into actionable steps for Codex-based workflo
ws.

---

## Project Snapshot
- Progressive Web App (PWA) that tracks pushups, workouts, nutrition and body metrics.
- Mobile-first UI with glassmorphism styling for iOS/Android PWA installs.
- Built with **React + TypeScript** via Vite.

Keep user value, accessibility and responsive behaviour front-of-mind for every change.

---

## Codex Working Agreements

### 1. Tooling & Research
- Prefer local repository knowledge before searching externally.
- Use existing scripts in `package.json` for linting, tests and builds.
- When documentation is required, consult files in `docs/` and project READMEs first.

### 2. Branching Model
- `main` → production.
- `develop` → staging/integration.
- Feature branches follow `feat/<topic>`; bug fixes `fix/<topic>` (branch from `develop`).

### 3. Commit Format (Conventional Commits)
```
type(scope): short summary

Optional body explaining context and decisions.

🤖 Generated with [ChatGPT Codex](https://openai.com/chatgpt)
Co-Authored-By: ChatGPT Codex <noreply@openai.com>
```
Allowed types: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `style`, `perf`.

### 4. Quality Gates Before PRs
1. Run relevant scripts:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:unit` or `npm run test:all` when UI/E2E impacted
2. Ensure zero TypeScript or ESLint issues.
3. Update **CHANGELOG.md** and bump `package.json` version for product-impacting work.
4. Produce/refresh screenshots for UI changes (light & dark mode) in `artifacts/`.

### 5. Definition of Ready (DoR)
Tick these before coding:
- [ ] Clear problem statement & acceptance criteria.
- [ ] Defined user impact and success metrics.
- [ ] Technical approach discussed/validated.
- [ ] Test plan agreed (unit / UI).
- [ ] Mobile + light/dark considerations noted.
- [ ] Dependencies or blockers surfaced.

### 6. Definition of Done (DoD)
Mark tasks complete only when:
- [ ] Feature works locally and passes QA scripts.
- [ ] Visual regression acceptable in light/dark modes.
- [ ] CHANGELOG entry + `package.json` version bump (when appropriate).
- [ ] Docs updated where relevant.
- [ ] Telemetry/logging considered.
- [ ] Branch hooks succeed (husky pre-commit/push).

### 7. Artifact Expectations
Output artifacts under `artifacts/` matching the agent role:
- `artifacts/bundle/` – bundle stats (performance changes).
- `artifacts/lighthouse/` – Lighthouse HTML reports.
- `artifacts/tests/` – coverage and Playwright screenshots.
- `artifacts/docs/` – documentation updates & images.

### 8. Design Guardrails
- Tiles must use a consistent glass card structure: rounded-2xl, translucent background, subtle border + shadow.
- Bottom navigation limited to three items: Dashboard, Group, Notes. Settings button stays in top-right header.
- Follow the color, typography, spacing and shadow tokens defined in Tailwind config / design docs.

### 9. Feature Flags & Archived Modules
- Reactivate the archived History page through `src/config/features.ts` (`HISTORY_ENABLED`).
- Archived AI motivational quote services live under `src/services/` and can be restored if business value returns.

### 10. Testing Strategy Overview
- Unit tests with Vitest (`npm run test:unit`).
- UI/visual regression via Playwright (`npm run test:ui`).
- Full suite (`npm run test:all`) before merging complex changes.
- Performance budgets enforced by `npm run perf:budget` and Lighthouse workflows.

### 11. Release Discipline
- Respect Semantic Versioning:
  - Patch → bug fixes/docs.
  - Minor → backwards-compatible features.
  - Major → breaking changes.
- Ensure CHANGELOG categories: 🎉 Features, 🐛 Bug Fixes, ⚡ Performance, 📚 Documentation, 🔧 Chore, ♻️ Refactor, 🧪 Tests.

### 12. Collaboration Notes
- Keep PRs < 300 line diff when possible.
- Include rationale and testing evidence in PR descriptions.
- Prefer squash merges into `develop` after approvals and passing CI.

---

Use this guide as the baseline for Codex-style agents to deliver high-quality contributions that align with the established Claud
e Code workflows while leveraging ChatGPT tooling.
