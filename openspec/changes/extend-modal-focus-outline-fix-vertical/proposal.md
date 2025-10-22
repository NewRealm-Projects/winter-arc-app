# Extend Modal Focus Outline Fix - Vertical Clipping

## Why

The previous fix (fix-modal-focus-outline-clipping) addressed horizontal clipping by adding `px-1` padding, but focus outlines are also clipped vertically at the top and bottom edges of modal content containers. This is particularly visible on tab buttons and the first/last input fields in forms.

**Visual evidence**: Focus outline on "Manual Entry" tab button in FoodLogModal is truncated at top/bottom edges (see: C:\Users\miket\Pictures\Issue02.png)

**Root cause**: Focus rings render outside the element's border box in all directions (top, right, bottom, left), but the current fix only provides horizontal padding.

## What Changes

- Extend padding from `px-1` (horizontal only) to `p-1` (all directions)
- Update existing ui-components spec to include vertical padding requirement
- Apply fix to all 7 modal components updated in previous change
- Update AppModal documentation to reflect full padding requirement

**Breaking**: None - this is an enhancement to the previous accessibility fix

## Impact

- **Affected specs**: `ui-components` (modify existing requirement)
- **Affected code**:
  - All 7 modal components: FoodLogModal, DrinkLogModal, WorkoutLogModal, WeightLogModal, PushupLogModal, PresetManagementModal, CheckInModal
  - `src/components/ui/AppModal.tsx` (update JSDoc)
- **User experience**: Complete focus outline visibility in all directions
- **Performance**: Negligible - changes 4px padding to 4px padding in all directions
- **Related**: Extends fix-modal-focus-outline-clipping
