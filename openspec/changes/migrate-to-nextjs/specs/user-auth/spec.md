# User Auth Migration Delta

## MODIFIED Requirements

### Requirement: Authentication Provider Integration

The system SHALL integrate Firebase Auth with both client-side SDK and server-side Admin SDK for Next.js SSR compatibility.

**Current**: Firebase Auth integration with client-side SDK for authentication flows.

**Modified**: Enhanced integration includes server-side Admin SDK for SSR token verification.

#### Scenario: SSR Authentication Check
- **WHEN** a user visits a protected page with SSR enabled
- **THEN** Next.js SHALL render the page on the server
- **AND** the authentication state SHALL be properly verified server-side
- **AND** the correct authenticated/unauthenticated content SHALL be rendered

#### Scenario: Client-side Auth State Sync
- **WHEN** a user is authenticated and navigation occurs
- **THEN** Next.js SHALL perform client-side routing
- **AND** the authentication state SHALL remain consistent
- **AND** no unnecessary re-authentication SHALL occur

### Requirement: Route Protection

The system SHALL use Next.js middleware and layout-based authentication for both SSR and client-side route protection.

**Current**: React Router guards using useAuth hook for client-side route protection.

**Modified**: Enhanced protection includes server-side middleware for initial route access control.

#### Scenario: Server-side Route Protection
- **WHEN** an unauthenticated user tries to access /dashboard
- **THEN** the Next.js middleware SHALL redirect them to the login page
- **AND** no protected content SHALL be rendered

#### Scenario: Layout-based Auth Checks
- **WHEN** a user navigates between protected pages
- **THEN** the layout component SHALL check authentication
- **AND** the auth state SHALL be verified without full page reload
- **AND** proper loading states SHALL be shown during verification

## ADDED Requirements

### Requirement: Next.js Middleware Authentication

The system SHALL implement Next.js middleware for server-side Firebase token verification on protected API routes.

#### Scenario: Middleware Token Verification
- **WHEN** a request hits a protected API route
- **THEN** the Next.js middleware SHALL process the request
- **AND** the Firebase token SHALL be verified server-side
- **AND** invalid tokens SHALL result in 401 responses

### Requirement: SSR Authentication Context

The system SHALL provide authentication context during server-side rendering for proper user state initialization.

#### Scenario: Server-side Auth Context
- **WHEN** a page requires authentication state during SSR
- **THEN** Next.js SHALL render the page on the server
- **AND** the authentication context SHALL be available
- **AND** the correct user state SHALL be passed to client components
