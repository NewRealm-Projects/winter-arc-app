# Implementation Tasks: Custom Hydration Presets

## 1. Data Model & Types
- [ ] 1.1 Add `DrinkPreset` interface to `src/types/index.ts`
- [ ] 1.2 Add `hydrationPresets?: DrinkPreset[]` field to `User` interface
- [ ] 1.3 Add preset validation utility function (max 5, valid amounts 50-5000ml, name length 1-30)
- [ ] 1.4 Update Firestore security rules to allow `hydrationPresets` writes

## 2. State Management
- [ ] 2.1 Add `updateUserPresets(presets: DrinkPreset[])` action to `src/store/useStore.ts`
- [ ] 2.2 Implement optimistic updates for preset changes
- [ ] 2.3 Add Firestore sync for `hydrationPresets` in `src/services/firestoreService.ts`
- [ ] 2.4 Add error handling for preset sync failures

## 3. Component Refactor
- [ ] 3.1 Rename `src/components/WaterTile.tsx` → `src/components/HydrationTile.tsx`
- [ ] 3.2 Remove hardcoded 250/500/1000ml quick-add buttons
- [ ] 3.3 Implement dynamic preset button rendering (0-5 buttons)
- [ ] 3.4 Add "+ Add Preset" button (shown only when <5 presets)
- [ ] 3.5 Update tile header: "Water" → "Hydration"
- [ ] 3.6 Update tile icon if needed (keep 💧 or allow user-selected default)
- [ ] 3.7 Preserve "✏️ Edit" button for manual input

## 4. Preset Management UI
- [ ] 4.1 Create `src/components/hydration/PresetButton.tsx` (display preset with emoji + name + amount)
- [ ] 4.2 Create `src/components/hydration/PresetManagementModal.tsx` (add/edit/delete UI)
- [ ] 4.3 Add preset form inputs: name (text, max 30), amount (number, 50-5000), emoji (text, optional)
- [ ] 4.4 Add emoji suggestions row (💧 🥤 ☕ 🍵 🥛 🧃 🍷 🍺)
- [ ] 4.5 Implement preset creation logic (generate UUID, validate, save)
- [ ] 4.6 Implement preset editing logic (pre-fill form, update on save)
- [ ] 4.7 Implement preset deletion logic (confirm prompt, remove from array)
- [ ] 4.8 Add max 5 preset validation (disable "+ Add Preset" when full)
- [ ] 4.9 Create `src/components/hydration/EmptyState.tsx` (hint for no presets)

## 5. Translations (i18n)
- [ ] 5.1 Update `tracking.water` → `tracking.hydration` in `src/i18n/translations.ts`
- [ ] 5.2 Add `hydration.addPreset` (de: "Getränk hinzufügen", en: "Add Preset")
- [ ] 5.3 Add `hydration.editPreset` (de: "Getränk bearbeiten", en: "Edit Preset")
- [ ] 5.4 Add `hydration.deletePreset` (de: "Getränk löschen", en: "Delete Preset")
- [ ] 5.5 Add `hydration.noPresets` (de: "Keine Getränke gespeichert", en: "No drink presets yet")
- [ ] 5.6 Add `hydration.noPresetsHint` (de: "Getränke hinzufügen für schnelles Tracking", en: "Add presets for quick tracking")
- [ ] 5.7 Add `hydration.presetName` (de: "Name", en: "Name")
- [ ] 5.8 Add `hydration.presetAmount` (de: "Menge (ml)", en: "Amount (ml)")
- [ ] 5.9 Add `hydration.presetEmoji` (de: "Emoji (optional)", en: "Emoji (optional)")
- [ ] 5.10 Add `hydration.maxPresetsReached` (de: "Maximal 5 Getränke möglich", en: "Max 5 presets allowed")
- [ ] 5.11 Add `hydration.deleteConfirm` (de: "'{name}' löschen? Diese Aktion kann nicht rückgängig gemacht werden.", en: "Delete '{name}'? This cannot be undone.")

## 6. Integration
- [ ] 6.1 Update `src/pages/DashboardPage.tsx` import: `WaterTile` → `HydrationTile`
- [ ] 6.2 Update any E2E tests referencing "Water" → "Hydration"
- [ ] 6.3 Update Storybook stories if `WaterTile.stories.tsx` exists

## 7. Testing
- [ ] 7.1 Unit tests for `DrinkPreset` validation (max 5, amount range, name length)
- [ ] 7.2 Unit tests for preset CRUD operations (add, edit, delete)
- [ ] 7.3 Unit tests for empty state rendering
- [ ] 7.4 E2E test: Add preset → Click preset button → Verify water increment
- [ ] 7.5 E2E test: Edit preset → Update name/amount → Verify changes persist
- [ ] 7.6 E2E test: Delete preset → Confirm → Verify removal
- [ ] 7.7 E2E test: Max 5 presets → Verify "+ Add Preset" disabled
- [ ] 7.8 E2E test: Manual input still works when no presets exist

## 8. Documentation
- [ ] 8.1 Update CHANGELOG.md with feature description
- [ ] 8.2 Update CLAUDE.md if hydration tracking section exists
- [ ] 8.3 Add inline code comments for preset validation logic
- [ ] 8.4 Update `openspec/specs/dashboard/spec.md` (archive this change after deployment)

## 9. Quality Checks
- [ ] 9.1 Run `npm run lint` (no errors/warnings)
- [ ] 9.2 Run `npm run typecheck` (no type errors)
- [ ] 9.3 Run `npm run test` (all tests pass, coverage ≥80%)
- [ ] 9.4 Run `npm run build` (successful production build)
- [ ] 9.5 Manual testing: Mobile (iPhone SE, Pixel 6), Desktop (Chrome, Firefox)
- [ ] 9.6 Verify dark mode styling for new modals
- [ ] 9.7 Verify accessibility (keyboard navigation, screen reader labels)

## 10. Deployment
- [ ] 10.1 Create feature branch: `miket/feature-custom-hydration-presets`
- [ ] 10.2 Commit changes with message: `feat: add custom hydration presets with management UI`
- [ ] 10.3 Push branch and create pull request
- [ ] 10.4 Wait for CI checks (TypeScript, ESLint, Tests, Build, Codacy)
- [ ] 10.5 Request code review
- [ ] 10.6 Address review feedback
- [ ] 10.7 Merge to main (squash and merge)
- [ ] 10.8 Archive OpenSpec change: `openspec archive add-custom-hydration-presets --yes`
