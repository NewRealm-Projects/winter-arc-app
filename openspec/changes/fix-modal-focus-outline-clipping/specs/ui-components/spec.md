## ADDED Requirements

### Requirement: Modal Focus Outline Visibility
The system SHALL ensure focus outlines on interactive elements within modals are fully visible and not clipped by container boundaries.

#### Scenario: Focus ring spacing in modal content
- **WHEN** an interactive element (input, button, select) inside a modal receives keyboard focus
- **THEN** the focus outline SHALL be fully visible
- **AND** the outline SHALL NOT be clipped at container edges
- **AND** the content wrapper SHALL provide minimum 4px (0.25rem) horizontal padding to accommodate 2px focus rings plus offset

#### Scenario: AppModal content wrapper padding
- **WHEN** rendering modal content via AppModal component
- **THEN** the direct child content container SHALL include `px-1` class (4px horizontal padding)
- **AND** the padding SHALL be sufficient for standard 2px focus rings (ring-2) with shadow offset
- **AND** the vertical content area MAY use `overflow-y-auto` without affecting horizontal outline visibility

#### Scenario: Keyboard navigation visibility
- **WHEN** user navigates modal form fields via Tab key
- **THEN** all focus indicators SHALL be fully visible
- **AND** focus transitions SHALL be clearly discernible
- **AND** outlines SHALL maintain consistent appearance across all input types (text, number, select)

#### Scenario: WCAG compliance for focus indicators
- **WHEN** modal contains focusable elements
- **THEN** focus indicators SHALL meet WCAG 2.1 Level AA contrast requirements (≥3:1 against background)
- **AND** focus indicators SHALL have minimum 2px thickness
- **AND** focus indicators SHALL be visible for all interactive elements
