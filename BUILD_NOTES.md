# Build Notes — read this before doing anything else

This repository was assembled incrementally, then had a round of security
fixes applied after a review. It is still a **partial backend, not a
finished product**. Don't mistake a security-controls table for an
external audit — none has happened.

## What's real and working

- Monorepo structure (pnpm workspaces: `apps/`, `services/`, `packages/`)
- Prisma schema — a complete data model for Users, Problems, Listings,
  Requests, Proposals, Reviews, Subscriptions, Messaging, Notifications,
  and Admin audit logs
- **`AuthModule`** — signup (restricted to SEEKER/SOLVER — see fixes
  below), login, refresh-token rotation with reuse detection, bcrypt
  password hashing, JWT access tokens, per-route rate limiting
- **`ProblemsModule`** — `POST /problems` (validated via
  `CreateProblemDto`, bound to the authenticated seeker) and
  `GET /problems/:id` (enforces `PRIVATE` as owner/admin-only, masks
  identity on `ANONYMOUS`)
- **`MatchingModule`** — weighted scoring algorithm, now filtered at the
  database level by category before scoring, wired to
  `GET /matching/:problemId`
- **`AllExceptionsFilter`** — global error handling, hides internal detail
  in production
- **`RolesGuard`**, **`OptionalJwtAuthGuard`**, **`SecurityHeadersMiddleware`**
- `AppModule` / `main.ts` — fails fast at boot if required secrets are
  missing; configures trust-proxy for correct rate limiting behind a load
  balancer
- `prisma/seed.ts` — seeds dev accounts; refuses to run when
  `NODE_ENV=production`
- `packages/ui` — shared `Card`/`Badge` components
- Two frontend screens (`/listings`, `/problems/new`) — still using
  mocked/hardcoded data client-side, **not yet calling the real API**
- Docker Compose (Postgres+pgvector, Redis), Terraform (VPC/RDS/
  ElastiCache/S3), GitHub Actions CI

## Security fixes applied in this round (previously flagged, now fixed)

1. **Privilege escalation via signup** — `SignupDto.role` no longer
   accepts the full `Role` enum; public signup is restricted to
   `SEEKER`/`SOLVER` only. Admin accounts must be created out-of-band.
2. **Hardcoded JWT fallback secret removed** — `JwtStrategy` and
   `AuthModule` now throw at startup if `JWT_SECRET` is unset, instead of
   silently signing tokens with a secret visible in the source.
3. **`PRIVATE` problem visibility now enforced** — previously any problem
   was readable by anyone with its id regardless of visibility.
4. **`POST /problems` now validates input** — replaced `body: any` with
   `CreateProblemDto` (length limits, enum checks, array-size limits).
5. **Refresh-token reuse detection** — presenting an already-revoked
   refresh token now revokes all of that user's tokens (possible-theft
   response) instead of just returning a generic error.
6. **CI lint gate actually gates now** — removed `|| true`, which had
   made lint failures invisible to the pipeline.
7. **Stricter throttling on auth endpoints** — signup/login/refresh have
   their own per-route limits (5–10/min) on top of the global 100/min.
8. **Length limits added to auth DTOs** to prevent oversized-input abuse.
9. **Tightened security headers** — `default-src 'none'` CSP (this is a
   JSON API, no HTML to allow), added `Referrer-Policy` and
   `Permissions-Policy`.
10. **Global exception filter** — internal error detail (stack traces,
    Prisma messages) no longer reaches the client in production.
11. **`trust proxy` configured** — rate limiting now sees real client IPs
    behind a load balancer instead of treating everyone as one IP.
12. **Matching query scoped to reduce load** — pre-filters candidates by
    category at the database level and caps the candidate set at 500,
    instead of loading every verified listing on the platform into memory
    per request. Still not the final scale answer — see the `TODO` in
    `matching.service.ts`.
13. **Seed script refuses to run in production** — it creates
    known-password accounts (including admin) and should never touch a
    real database.

## Known remaining gaps — not yet fixed

- **Per-account brute-force protection.** Auth throttling is per-IP only;
  an attacker spreading login attempts across many IPs against one
  account isn't slowed down. Consider account-level lockout as a
  follow-up.
- **`isEmailVerified: true` is set unconditionally at signup.** No real
  verification-email flow exists. Don't treat that field as meaningful.
- **Matched-solver exception for `PRIVATE` problems** doesn't exist yet —
  will need `RequestsLeadsModule` first.
- **`UsersModule`, `ListingsModule`, `RequestsLeadsModule`,
  `ProposalsModule`, `ReviewsModule`, `BillingModule`, `AdminModule`** —
  still empty `@Module({})` shells. No listing CRUD, contact/request
  flow, proposals, reviews, payments, or admin moderation.
- **CI will likely fail on first push** now that the lint gate isn't
  silenced — none of the workspace packages have an actual ESLint config
  or the `eslint` package installed yet. Add real lint config before
  relying on this gate, or `pnpm add -D eslint` plus a shared config in
  `packages/config` and point each package's `lint` script at it.
- **No database migrations, no lockfile yet** — run
  `pnpm install` and `npx prisma migrate dev --name init` locally and
  commit the results.
- **`Dockerfile.api`** — written but never built/tested in this sandbox
  (no network access here); expect to debug it on first real build.
- **Duplicate UI components** — `Card`/`Badge` exist in both
  `packages/ui/src/index.tsx` and `apps/web/components/ui/`. Consolidate.

## Suggested next steps, in order

1. `pnpm install` locally, confirm it resolves, commit the lockfile.
2. Set up real ESLint config before your next CI run, or the pipeline
   will fail immediately on the (now-enforced) lint step.
3. `cd services/api && npx prisma migrate dev --name init && npx prisma db seed`
4. Point the two existing frontend pages at the real API instead of
   hardcoded mock data.
5. Implement `ListingsModule` and `RequestsLeadsModule` next.
6. Add account-level login lockout once real users exist to protect.

If you hand this repository to an AI coding agent, point it at
`MASTER_AI_BUILD_PROMPT.md` and this file together.
