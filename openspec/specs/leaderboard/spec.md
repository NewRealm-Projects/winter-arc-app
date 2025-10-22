# Leaderboard

Group rankings with calendar heatmap and member statistics.

## Purpose

Provide competitive group tracking with week/month/all-time rankings, progress heatmaps, and detailed member statistics for enabled activities.

## Requirements

### Requirement: User Statistics Summary
The system SHALL display current user stats in header cards.

#### Scenario: Personal stats display
- **WHEN** viewing leaderboard
- **THEN** system SHALL display streak days with fire emoji
- **AND** system SHALL display total pushups
- **AND** system SHALL display sport sessions count
- **AND** system SHALL calculate from combined tracking data

### Requirement: Time Range Filtering
The system SHALL support week, month, and all-time leaderboard views.

#### Scenario: Filter selection
- **WHEN** user selects "Week" filter
- **THEN** system SHALL load group members from `startOfWeek` to `endOfWeek`
- **AND** system SHALL display week progress circles
- **WHEN** user selects "Month" filter
- **THEN** system SHALL load group members from `startOfMonth` to `endOfMonth`
- **AND** system SHALL display calendar heatmap
- **WHEN** user selects "All" filter
- **THEN** system SHALL load all-time group member data without date constraints

### Requirement: Week Progress Circles
The system SHALL display 7-day week view with daily progress indicators.

#### Scenario: Week circles rendering
- **WHEN** filter is "Week"
- **THEN** system SHALL render 7 day circles (Mon-Sun)
- **AND** system SHALL calculate progress for each day based on enabled activities
- **AND** system SHALL mark today's circle distinctly
- **AND** system SHALL show half-fill indicator (50-99%) with special styling

#### Scenario: Progress calculation
- **WHEN** calculating day progress
- **THEN** system SHALL divide 100% by (enabled activities + 1 for weight)
- **AND** system SHALL add points if pushups > 0 (if enabled)
- **AND** system SHALL add points if active sports > 0 (if enabled)
- **AND** system SHALL add points if water >= 2000ml (if enabled)
- **AND** system SHALL add points if protein >= 100g (if enabled)
- **AND** system SHALL add points if weight tracked

### Requirement: Monthly Calendar Heatmap
The system SHALL display month grid with daily progress circles.

#### Scenario: Month grid rendering
- **WHEN** filter is "Month"
- **THEN** system SHALL render 7x5 grid with weekday headers (Mo-Su)
- **AND** system SHALL add offset for first day of month
- **AND** system SHALL render all days in month with progress circles
- **AND** system SHALL dim non-current month days
- **AND** system SHALL mark today distinctly

### Requirement: Group Rankings
The system SHALL display sorted member list with expandable details.

#### Scenario: Rankings display
- **WHEN** loading group members
- **THEN** system SHALL fetch from `getGroupMembers(groupCode, startDate, endDate)`
- **AND** system SHALL sort by total pushups (primary), then by streak (secondary)
- **AND** system SHALL assign ranks 1, 2, 3, ... with special badges for top 3

#### Scenario: Member card styling
- **WHEN** rendering member card
- **THEN** system SHALL display rank badge with gradient for top 3
- **AND** system SHALL show profile picture OR initials avatar
- **AND** system SHALL display nickname with "You" badge for current user
- **AND** system SHALL show streak days and today's pushups
- **AND** system SHALL highlight current user with ring and shadow

#### Scenario: Expandable member details
- **WHEN** user clicks member card
- **THEN** system SHALL toggle expansion of card
- **AND** system SHALL display stats grid with enabled activities only:
  - Pushups: Total count
  - Sports: Session count
  - Water: Average in liters (1 decimal)
  - Protein: Average in grams
- **AND** system SHALL adapt grid layout (2 or 4 columns) based on stat count

### Requirement: Profile Picture Privacy
The system SHALL respect profile picture sharing settings in leaderboard.

#### Scenario: Profile picture visibility
- **WHEN** rendering member card
- **THEN** system SHALL show photo if `shareProfilePicture` is true OR user is current user
- **AND** system SHALL show initials avatar if photo hidden or unavailable
- **AND** system SHALL handle photo load errors gracefully

### Requirement: Empty States
The system SHALL handle missing group data gracefully.

#### Scenario: No group code
- **WHEN** user has no groupCode
- **THEN** system SHALL display "None" in group code badge

#### Scenario: No group members
- **WHEN** leaderboard data is empty
- **THEN** system SHALL display "No members" message

## Technical Notes

### Implementation Files
- `src/pages/LeaderboardPage.tsx` - Leaderboard UI with heatmap and rankings

### Data Sources
- `groups/{groupCode}` - Group metadata
- `users` collection - Member profiles
- `tracking/{userId}/entries` - Member tracking data

### Dependencies
- date-fns (date manipulation, formatting)
- `getGroupMembers` service - Group data fetching with date range
- `useCombinedTracking` - Merged manual + smart data

### Design Patterns
- **Responsive grid**: 7-column week/month grid
- **Privacy-first**: Profile pictures only visible if shared
- **Expandable cards**: Click to view detailed stats
- **Activity filtering**: Only show stats for enabled activities
