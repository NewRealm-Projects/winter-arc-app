# Fix Modal Focus Outline Clipping

## Why

Focus outlines on interactive elements within modals (specifically input fields) are being clipped at the modal content edges. This occurs because focus rings render outside the element's border box, but insufficient horizontal padding in parent containers causes the outline to be cut off. This creates an accessibility issue where keyboard navigation visual indicators are incomplete or invisible.

**Visual evidence**: Focus outline on search input in FoodLogModal is truncated at left/right edges (see: C:\Users\miket\Pictures\Issue01.png)

## What Changes

- Add horizontal padding to modal content containers to accommodate focus rings
- Establish accessibility requirement for focus outline visibility in modal components
- Update AppModal component usage patterns to ensure proper spacing
- Document focus ring spacing requirements in UI component specs

**Breaking**: None - this is a visual fix that improves accessibility without changing APIs

## Impact

- **Affected specs**: `ui-components` (new capability)
- **Affected code**:
  - `src/components/notes/FoodLogModal.tsx` (line 277: content wrapper)
  - `src/components/ui/AppModal.tsx` (potentially: documentation/usage guidelines)
  - Any other modals using AppModal with form inputs (CheckInModal, SportModal, etc.)
- **User experience**: Improved keyboard navigation visibility, better WCAG compliance
- **Performance**: Negligible - only adds minimal padding (4px horizontal)
