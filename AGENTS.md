# AGENTS.md

## Build/Lint/Test Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (no custom config, uses Next.js defaults)
- `npm test` - Run unit tests with Vitest (watch mode)
- `npm run test:run` - Run unit tests once
- `npm run test:ui` - Run unit tests with UI
- `npm run test:e2e` - Run e2e tests with Playwright
- `npm run test:e2e:ui` - Run e2e tests with Playwright UI

## Data Migration
- `node scripts/migrate-data.js` - Migrate mock events to MinIO (run once after setup)
- `node scripts/create-tables.js` - Create PostgreSQL tables (run once after setup)

## Docker Commands
- `docker compose up --build` - Build and start all services (app + PostgreSQL + MinIO)
- `docker compose up` - Start all services
- `docker compose down` - Stop all services
- `docker compose logs app` - View application logs
- `docker compose logs postgres` - View PostgreSQL logs
- `docker compose logs minio` - View MinIO logs
- PostgreSQL: localhost:5432 (user/password/photo_gallery)
- MinIO Console: http://localhost:9001 (admin/minioadmin)
- MinIO API: http://localhost:9000

## Code Style Guidelines

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig.json)
- Use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use `type` for unions, primitives, and utility types

### Imports
- Use path aliases: `@/` for root, `@/components`, `@/lib`, `@/hooks`
- Group imports: React/React-related first, then external libraries, then internal imports
- Use named imports over default imports where possible

### Components
- Use functional components with TypeScript interfaces for props
- Add `"use client"` directive for client components
- Use `cn()` utility from `@/lib/utils` for conditional Tailwind classes
- Follow shadcn/ui "new-york" style conventions

### Naming Conventions
- Components: PascalCase (e.g., `PhotoCard`, `EventGallery`)
- Functions: camelCase (e.g., `formatDate`, `getAllEvents`)
- Files: kebab-case for components (e.g., `photo-card.tsx`), camelCase for utilities
- Interfaces: PascalCase with descriptive names (e.g., `PhotoCardProps`)

### Error Handling
- Use try/catch for async operations
- Provide meaningful error messages
- Handle loading states appropriately

### Styling
- Use Tailwind CSS with CSS variables for theming
- Support dark mode with `dark:` prefixes
- Use responsive design with mobile-first approach
- Follow shadcn/ui component patterns

### Localization
- Use Portuguese (pt-BR) for user-facing text and date formatting
- Use `Intl.DateTimeFormat` for date localization</content>
<parameter name="filePath">/home/rod/projetos/photo-gallery/AGENTS.md