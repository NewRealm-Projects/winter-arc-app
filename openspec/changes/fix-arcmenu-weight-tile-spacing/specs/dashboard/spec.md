# DELTA Spec: Dashboard Mobile Spacing & ArcMenu Positioning

**Change**: `fix-arcmenu-weight-tile-spacing`

---

## MODIFIED Requirements

### Requirement: Mobile Dashboard Layout
The system SHALL render all dashboard elements within a single mobile viewport without vertical scrolling.

#### Scenario: Mobile viewport (375px height: 603px usable)
- **WHEN** viewing dashboard on mobile (375px width)
- **THEN** system SHALL fit all elements (WeeklyTile, UnifiedTrainingCard, Tracking tiles, Plus button) within 603px usable height
- **AND** system SHALL NOT require vertical scrolling
- **AND** system SHALL use compressed padding (p-2 = 8px) and gaps (gap-2 = 8px) on mobile

#### Scenario: Weight tile visibility
- **WHEN** viewing dashboard on mobile
- **THEN** system SHALL render Weight tile fully visible
- **AND** system SHALL ensure Weight tile is not overlapped by plus button
- **AND** system SHALL maintain clear visual separation (24px+) between Weight tile and plus button

#### Scenario: ArcMenu positioning (NEW)
- **WHEN** viewing ArcMenu on mobile
- **THEN** system SHALL position arc SVG concentrically with plus button
- **AND** system SHALL center arc geometry on button center point
- **AND** system SHALL display arc as unified component with button (no visible gap)

---

## ADDED Requirements

### Requirement: ArcMenu Geometric Centering
The system SHALL ensure ArcMenu arc and plus button appear as one cohesive visual unit.

#### Scenario: Arc concentricity
- **WHEN** ArcMenu renders
- **THEN** system SHALL calculate plus button center point (x, y)
- **AND** system SHALL position SVG container so arc geometric center aligns with button center
- **AND** system SHALL use centered positioning (left: 50%, top: 50%, transform: translate(-50%, -50%)) for alignment
- **AND** visual inspection SHALL confirm no gap between arc perimeter and button boundary

#### Scenario: Arc appearance after positioning fix
- **WHEN** plus button is clicked to reveal arc
- **THEN** arc SHALL appear as inverted bowl surrounding button
- **AND** arc SHALL look like single integrated component with button
- **AND** each arc slice SHALL remain clickable with equal spacing

---

**Status**: PROPOSED
**Files**: ArcMenu.tsx, DashboardMobile.tsx, WeeklyTile.tsx, UnifiedTrainingCard.tsx, Tracking Tiles
