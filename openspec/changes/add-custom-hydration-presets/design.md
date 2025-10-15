# Design: Custom Hydration Presets

## Context

The current Water Tile uses hardcoded quick-add buttons that don't reflect real-world beverage consumption patterns. Users drink different beverages (coffee, tea, sports drinks) in varying amounts. This design introduces user-customizable drink presets for personalized tracking.

## Goals / Non-Goals

### Goals
- Allow users to define up to 5 custom drink presets
- Store presets per-user in Firebase (sync across devices)
- Maintain backward compatibility with existing water tracking data
- Preserve manual input option for one-off entries
- Provide intuitive preset management (add/edit/delete)

### Non-Goals
- Calorie tracking per drink (out of scope - handled by NutritionTile)
- Multi-ingredient drinks (e.g., cocktails with % alcohol)
- Preset sharing between users or groups
- Automatic hydration reminders based on presets (future feature)
- Preset templates or recommendations (users define their own)

## Decisions

### 1. Data Model

**DrinkPreset Interface:**
```typescript
interface DrinkPreset {
  id: string;        // UUID v4 for stable identity
  name: string;      // Max 30 chars, e.g., "Coffee", "Water Bottle"
  amountMl: number;  // Positive integer, range: 50-5000ml
  emoji?: string;    // Optional single emoji, default: 💧
  order: number;     // Display order (0-4), user-sortable
}

interface User {
  // ... existing fields
  hydrationPresets?: DrinkPreset[]; // Max 5, undefined = empty
}
```

**Why UUID for id?**
- Stable across edits (vs array index)
- Enables future preset sharing or import/export
- Simplifies delete/reorder logic

**Why max 5 presets?**
- Prevents UI clutter (mobile-first design)
- Forces users to focus on most frequent drinks
- Matches tile space constraints (3-column grid = 2 rows max)

**Why order field?**
- Allows user-defined button arrangement
- Drag-to-reorder future enhancement
- Default: creation order (0, 1, 2, 3, 4)

### 2. UX Flow

**Empty State (No Presets):**
```
┌─────────────────────────────────┐
│ 💧 Hydration           0.0L     │
├─────────────────────────────────┤
│ Progress: 0% / 3.0L             │
├─────────────────────────────────┤
│ No drink presets yet            │
│ Add presets for quick tracking  │
│                                 │
│ [+ Add Preset]                  │
│ [✏️ Edit (Manual Input)]        │
└─────────────────────────────────┘
```

**With Presets (Example: 3 presets):**
```
┌─────────────────────────────────┐
│ 💧 Hydration           1.5L     │
├─────────────────────────────────┤
│ Progress: 50% / 3.0L            │
├─────────────────────────────────┤
│ [☕ Coffee   ]  [💧 Bottle  ]   │
│   250ml          500ml           │
│                                 │
│ [🥤 Water    ]  [+ Add Preset]  │
│   2000ml                         │
│                                 │
│ [✏️ Edit (Manual Input)]        │
└─────────────────────────────────┘
```

**Preset Button Layout:**
- Grid: `grid-cols-2` (mobile), `grid-cols-3` (desktop >640px)
- Each button: Emoji + Name (top line), Amount (bottom line)
- "+ Add Preset" button: Shown only if <5 presets
- Long-press or settings icon: Edit/Delete modal

### 3. Preset Management Modal

**Add Preset Modal:**
```
┌────────────────────────────────┐
│ Add Drink Preset            [X]│
├────────────────────────────────┤
│ Name:                          │
│ [Coffee          ]  Max 30 chr │
│                                │
│ Amount (ml):                   │
│ [250            ]              │
│                                │
│ Emoji (optional):              │
│ [☕              ]  Tap to pick│
│                                │
│ Suggestions:                   │
│ 💧 🥤 ☕ 🍵 🥛 🧃 🍷 🍺       │
│                                │
│ [Cancel]           [Save]      │
└────────────────────────────────┘
```

**Edit Preset Modal:**
- Same fields as Add, pre-filled with current values
- Additional [Delete] button (red, bottom-left)
- Confirmation prompt for delete: "Delete '{name}'? This cannot be undone."

**Validation Rules:**
- Name: 1-30 characters, required
- Amount: 50-5000ml, required, integer only
- Emoji: Single character, optional (default: 💧)
- Max 5 presets: Show error if trying to add 6th

### 4. Component Architecture

**File Structure:**
```
src/components/
├── HydrationTile.tsx              # Main tile component
├── hydration/
│   ├── PresetButton.tsx           # Individual preset button
│   ├── PresetManagementModal.tsx  # Add/Edit preset modal
│   └── EmptyState.tsx             # No presets hint
```

**State Management:**
- Presets stored in `user.hydrationPresets` (Zustand + Firebase sync)
- Add action: `updateUserPresets(presets: DrinkPreset[])`
- Optimistic updates: Update local state immediately, sync to Firebase async
- Debounce: None (preset changes are infrequent, <1/day typically)

### 5. Migration Strategy

**For Existing Users:**
- Default: `hydrationPresets = undefined` (empty)
- No automatic migration from hardcoded buttons
- Show empty state with helpful hint on first visit
- Optional onboarding tooltip: "New: Create custom drink presets!"

**For New Users:**
- Same as existing: no presets by default
- Onboarding flow could suggest 2-3 common presets (future enhancement)

**Database Writes:**
- Single write to `users/{userId}` on preset add/edit/delete
- Batch multiple changes if user edits rapidly (e.g., reorder)
- No migration script needed (additive field)

## Risks / Trade-offs

### Risk: User confusion with empty state
**Mitigation:**
- Clear hint: "Add drink presets for quick tracking or use Edit to input manually"
- Prominent "+ Add Preset" button
- Manual input always available as fallback

### Risk: 5-preset limit feels restrictive
**Mitigation:**
- Research shows most users drink 2-4 beverage types daily
- Users can edit presets anytime (e.g., swap "Tea" for "Smoothie")
- Future: Analytics to validate if users hit limit frequently

### Risk: Emoji picker complexity (mobile keyboards)
**Mitigation:**
- Show 8-12 common drink emojis as suggestions
- Allow keyboard input for full emoji set
- Default to 💧 if no emoji selected (always looks reasonable)

### Trade-off: Removed hardcoded buttons
**Justification:**
- Forces intentional setup (better long-term UX)
- Prevents "good enough" defaults that users never customize
- Manual input remains for quick one-offs

## Open Questions

1. **Should presets sync in real-time or on app restart?**
   - Decision: Real-time via Firestore listener (consistent with other user data)

2. **Allow decimal amounts (e.g., 250.5ml)?**
   - Decision: No, integer only (simpler input, 1ml precision unnecessary)

3. **Show preset creation count in onboarding?**
   - Decision: Yes, add tooltip on first Dashboard visit: "Tip: Create drink presets for faster tracking"

4. **Future: Preset analytics (most-used drink)?**
   - Decision: Out of scope for v1, revisit in 3 months based on usage data
