---
description: Repository Information Overview
alwaysApply: true
---

# Track Booking Buddy Information

## Summary
Track Booking Buddy is a stadium reservation system built with modern web technologies. It allows users to manage and schedule track bookings, handle contractors, and generate PDF reports for reservations. The application uses Supabase for backend services and data storage.

## Structure
- **src/**: Main application source code
  - **components/**: UI components including forms and dialogs
  - **hooks/**: Custom React hooks
  - **integrations/**: External service integrations (Supabase)
  - **lib/**: Utility libraries
  - **pages/**: Application pages and routes
  - **types/**: TypeScript type definitions
  - **utils/**: Utility functions including PDF generation
- **public/**: Static assets
- **supabase/**: Supabase configuration

## Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.8.3
**Build System**: Vite 5.4.19
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 18.3.1
- React Router 6.30.1
- Supabase JS 2.75.0
- TanStack React Query 5.83.0
- shadcn/ui (via Radix UI components)
- Tailwind CSS 3.4.17
- jsPDF 3.0.3 (for PDF generation)
- date-fns 4.1.0 (date utilities)
- zod 3.25.76 (schema validation)

**Development Dependencies**:
- Vite 5.4.19
- TypeScript 5.8.3
- ESLint 9.32.0
- PostCSS 8.5.6
- Tailwind CSS 3.4.17
- Lovable Tagger 1.1.10

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Configuration
**Environment Variables**:
- VITE_SUPABASE_URL: Supabase project URL
- VITE_SUPABASE_PUBLISHABLE_KEY: Supabase public API key
- VITE_SUPABASE_PROJECT_ID: Supabase project identifier

## Main Entry Points
**Application Entry**: src/main.tsx
**Main Component**: src/App.tsx
**Primary Routes**:
- / (Index.tsx): Main application page
- * (NotFound.tsx): 404 page

## Supabase Integration
**Client Setup**: src/integrations/supabase/client.ts
**Configuration**: Environment variables in .env file
**Features**: Authentication, data storage, and real-time updates