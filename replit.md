# Overview

Uddan is a fully dynamic, production-grade website for abroad consultancy and global job finder services. The application serves students and professionals seeking international job opportunities and study abroad services. Built with a modern tech stack, it features a clean UI with subtle animations, comprehensive job search functionality, testimonial management, service forms, and an admin panel for content management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling and development server
- **Routing**: Wouter for client-side routing with conditional rendering based on authentication state
- **UI Components**: Radix UI primitives with shadcn/ui component system for consistent design
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack React Query for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Animations**: CSS-based animations with Lottie support for vector animations

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **API Design**: RESTful API with structured route organization
- **Database**: JSON file-based database with custom storage adapter for high performance
- **Session Management**: Express sessions with memory store for user sessions
- **Middleware**: Custom logging, error handling, and authentication middleware
- **Development**: Hot module replacement via Vite integration in development mode

## Authentication System
- **Provider**: Replit OpenID Connect (OIDC) integration
- **Strategy**: Passport.js with OpenID Client for authentication flow
- **Session Storage**: In-memory session storage with configurable TTL
- **Authorization**: Role-based access control (user, admin, editor roles)
- **Security**: HTTP-only cookies, secure session handling, CSRF protection

## Database Schema (JSON-Based)
- **Users**: Profile management with role-based permissions stored in JSON files
- **Companies**: Job provider information with metadata in structured JSON format
- **Jobs**: Comprehensive job listings with filtering capabilities using JSON storage
- **Job Applications**: Application tracking with user relationships in JSON documents
- **Testimonials**: Customer feedback with verification and visibility controls in JSON
- **Form Submissions**: Generic form data storage for various service types as JSON
- **Resources**: Content management for guides, blogs, and educational materials
- **Sessions**: In-memory session management for authentication

## API Structure
- **Public Endpoints**: Job listings, testimonials, resources (no authentication required)
- **Protected Endpoints**: User profile, job applications, form submissions (authentication required)
- **Admin Endpoints**: Content management, user management (admin/editor roles required)
- **Data Validation**: Zod schemas shared between frontend and backend for type safety
- **Error Handling**: Structured error responses with appropriate HTTP status codes

# External Dependencies

## Database Services
- **JSON Database**: High-performance file-based storage with transaction logging
- **Connection Management**: Direct file system operations with automatic caching

## Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication
- **Session Store**: In-memory session storage with express-session

## UI Component Libraries
- **Radix UI**: Accessible component primitives (@radix-ui/react-*)
- **Lottie**: Vector animation support via @lottiefiles/react-lottie-player
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **TypeScript**: Type safety across the full stack
- **Vite**: Build tool with development server and HMR
- **ESBuild**: Production bundle compilation for server code
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

## Form and Data Handling
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Schema validation and type inference
- **Date-fns**: Date manipulation and formatting utilities

## Deployment Configuration
- **Environment Variables**: SESSION_SECRET, REPL_ID, ISSUER_URL (no DATABASE_URL needed)
- **Build Process**: Separate client and server builds with static asset serving
- **Production**: Node.js server with pre-built client assets and JSON database
- **Database Files**: Encrypted JSON files with automatic backup and transaction logging