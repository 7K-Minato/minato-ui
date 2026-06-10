<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tech Stack

- Next.js 15 (App Router), React 18, TypeScript 5.5+ (strict)
- Prisma 7+ with PostgreSQL 15+
- NextAuth.js v5 (Auth.js) — JWT strategy, Basic + OIDC
- TanStack Query + Zustand (state)
- React Hook Form + Zod (forms)
- `7k-design-system` (external package, transpiled)
- Tailwind CSS v4
- Vitest + RTL (unit), Playwright (e2e)

## Required Setup Step

**Always run `npx prisma generate` after `npm install` and before any build, test, or typecheck.** The Prisma client is generated and required for compilation.

## Developer Commands

```bash
# Required order in CI: lint → typecheck → test → build
npm run lint          # ESLint (flat config, .mjs)
npm run typecheck     # tsc --noEmit
npm run test          # Vitest run (jsdom, excludes tests/e2e)
npm run test:watch    # Vitest watch mode
npm run test:e2e      # Playwright (auto-starts dev server, reuses if running)
npm run test:e2e:ui   # Playwright with UI
npm run build         # Next.js build (standalone output for Docker)
```

## Database

```bash
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
npm run db:deploy     # prisma migrate deploy
npm run db:studio     # Prisma Studio
```

Prisma config is in `prisma.config.ts` (not `.prisma`). Schema at `prisma/schema.prisma`.

## Architecture

**BFF Proxy Pattern**: The UI does NOT call control planes directly from the browser. All CP API calls go through `/api/proxy/[...path]` which:
1. Reads `X-Control-Plane-Id` header
2. Looks up CP URL + credentials from Prisma
3. Forwards the request with auth (Basic or Bearer)
4. Returns the CP response

Client-side API modules (`lib/*-api.ts`) call `/api/proxy/...` with the `X-Control-Plane-Id` header. React Query hooks live in `lib/queries/`.

## Auth

- JWT session strategy (30 days)
- Custom session types in `types/next-auth.d.ts` — adds `role`, `controlPlaneUrl`, `authMode`, `accessToken`
- Middleware (`middleware.ts`) protects all non-public routes
- Login page at `/login`, error redirect also to `/login`
- OIDC provider is configured but placeholder (not fully implemented)

## Important Conventions

- **Path alias**: `@/*` maps to `./*` (project root)
- **Route handlers**: Mark as `export const dynamic = "force-dynamic"` when using auth/session
- **Design system**: Imported from `7k-design-system/react` and `7k-design-system/css`. Always dark theme (`defaultTheme="dark"` in ThemeProvider)
- **No server components for data fetching**: Pages use `"use client"` with React Query hooks, not async server components
- **Environment**: `.env` is committed with dev defaults (not sensitive). Production secrets via env vars

## CI/CD

GitHub Actions (`/.github/workflows/`):
- `ci.yml`: lint+typecheck → test → build (needs `prisma generate` in each job)
- `e2e.yml`: Runs Playwright on push/PR to main/develop
- `cd.yml`: Triggered on `v*` tags — builds Docker image (distroless Node.js 22), pushes to Harbor, packages Helm chart

## Testing

- **Unit tests**: Vitest with jsdom. Setup at `tests/unit/setup.ts`. Only one test file exists (`tests/unit/dashboard.test.tsx`)
- **E2E tests**: Playwright in `tests/e2e/`. Auto-starts dev server. Tests against Chromium + Firefox
- Mock `global.fetch` in unit tests (see existing pattern in `dashboard.test.tsx`)

## Deployment

- Docker: Multi-stage build, distroless Node.js 22 base, standalone output
- Helm chart in `deploy/helm/minato-ui/`
- Includes CloudNativePG (CNPG) for PostgreSQL HA

## Gotchas

- `prisma generate` is not automatic — must run explicitly
- The proxy route is the ONLY way to talk to control planes; never call CP URLs directly from client components
- Control plane credentials are stored as JSON strings in the `credentials` column
- `next.config.ts` sets `output: "standalone"` — required for Docker
- E2E tests will fail if port 3000 is occupied and not reused
