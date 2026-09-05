# SmritiCare AI

SmritiCare AI is a private, non-diagnostic cognitive practice and caregiver companion for elders and their families.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the authenticated API server on port 8080
- `pnpm --filter @workspace/smriticcare-ai run dev` — run the React/Vite web artifact
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; Clerk environment values are managed by Replit.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/smriticcare-ai/src/App.tsx` — product routes, elder/caregiver screens, Clerk auth routing, local-first UI state
- `artifacts/smriticcare-ai/src/lib/time.ts` — centralized Asia/Kolkata date/time formatting
- `artifacts/smriticcare-ai/src/lib/api.ts` — authenticated browser API client
- `artifacts/api-server/src/routes/smriticcare.ts` — authenticated profile, activity, connection, and caregiver overview endpoints
- `lib/db/src/schema/smriticcare.ts` — Drizzle tables for profiles and user-owned activity
- `artifacts/smriticcare-ai/src/index.css` — warm teal/coral/cream visual system

## Architecture decisions

- Clerk owns authentication, password recovery, and session security; passwords never enter browser storage or the application database.
- User-owned records are stored server-side and mirrored into user-scoped localStorage for offline-first use. Failed syncs are not reported as successful.
- Caregiver access requires an authenticated caregiver profile, an elder connection code, and explicit elder memory-sharing consent (off by default).
- Dates are generated through the shared IST utilities; activity records store both an instant and the user’s Asia/Kolkata date key.
- Demo caregiver charts are visibly labeled and are never mixed with connected elder activity.

## Product

- Welcome, sign-in, sign-up, forgot-password entry, role onboarding, protected elder and caregiver routes, and logout.
- Elder home, routines, memory collection, life stories, voice helper, accessible settings, adaptive-friendly cognitive games, progress, and privacy messaging.
- Caregiver connection-code flow, authorization status, memory opt-in visibility, connected activity overview, trends, and printable reports.

## User preferences

- Keep the product warm, plain-spoken, accessible, and explicitly non-diagnostic.

## Gotchas

- Run `pnpm --filter @workspace/db run push` after changing the Drizzle schema in development; production schema changes are applied through Publish.
- Build the web artifact with its workflow-provided `PORT` and `BASE_PATH`; the Vite config intentionally fails without them.
- Do not use browser UTC helpers for user-facing dates; use `src/lib/time.ts`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
