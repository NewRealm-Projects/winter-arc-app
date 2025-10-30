# Build System Specification Delta

## MODIFIED Requirements

### R-BUILD-001: Development Server

**Current**: Vite development server on port 5173 with separate Vercel dev server on port 3000.

**Modified**: Single Next.js development server with integrated API routes and frontend serving.

#### Scenario: Unified Development Environment
- **Given** a developer wants to start the development environment
- **When** they run the development command
- **Then** a single server should start with both frontend and API functionality
- **And** hot reload should work for both frontend and API changes

### R-BUILD-002: Production Build

**Current**: Separate builds for Vite frontend (static files) and Vercel Functions (serverless).

**Modified**: Single Next.js build process generating optimized frontend and API routes.

#### Scenario: Production Build Process
- **Given** the project is ready for deployment
- **When** the build command is executed
- **Then** Next.js should generate optimized static files and serverless functions
- **And** the build should be deployable to Vercel as a single unit

## ADDED Requirements

### R-BUILD-010: TypeScript Integration

#### Scenario: Enhanced TypeScript Support
- **Given** the project uses TypeScript
- **When** Next.js processes TypeScript files
- **Then** type checking should be faster and more accurate
- **And** API routes should have proper type inference from client

### R-BUILD-011: App Router File Structure

#### Scenario: App Router Directory Structure
- **Given** the project uses Next.js App Router
- **When** files are organized in the app/ directory
- **Then** routing should be automatically generated from file structure
- **And** layouts should be properly nested and applied
