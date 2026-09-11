# Build Notes — read this before doing anything else

This repository was assembled from code you supplied plus the minimum
scaffolding needed for it to install and boot. It is **an early skeleton,
not a working product**, and it is not ready for real users. Please don't
mistake the presence of a security-controls table or a CI file for an
actual security review — none has happened.

## What's real and working

- Monorepo structure (pnpm workspaces: `apps/`, `services/`, `packages/`)
- Prisma schema (`services/api/prisma/schema.prisma`) — a complete, well
  thought out data model for Users, Problems, Listings, Requests,
  Proposals, Reviews, Subscriptions, Messaging, Notifications, and Admin
  audit logs
- `MatchingService` — a real (if simple) weighted scoring algorithm
- `RolesGuard` and `SecurityHeadersMiddleware` — real, usable code
- `AppModule` / `main.ts` — real NestJS bootstrap with global validation,
  CORS, and rate limiting wired up
- Two real frontend screens (`/listings`, `/problems/new`) with working
  UI and local component state — **but they call no real API**; the data
  is hardcoded/mocked in the component
- Docker Compose for local Postgres (with pgvector) + Redis
- Terraform for a basic AWS VPC, RDS, ElastiCache, and S3 bucket
- GitHub Actions CI skeleton (install, audit, lint, test)

## What's stubbed — do not treat these as done

- **`AuthModule`, `UsersModule`, `ProblemsModule`, `ListingsModule`,
  `RequestsLeadsModule`, `ProposalsModule`, `ReviewsModule`,
  `BillingModule`, `AdminModule`** — all empty `@Module({})` stubs I added
  so `AppModule` would compile. **None of these have controllers,
  services, or DTOs yet.** No signup, no login, no problem submission
  endpoint, no listing CRUD, nothing — despite the frontend screens
  suggesting otherwise.
- **`MatchingModule`** — wires up the real `MatchingService`, but there is
  still no `MatchingController`, so `GET /api/v1/matching/:problemId`
  (used by the e2e test) does not exist yet.
- **Password hashing, JWT issuance/verification, refresh token rotation,
  MFA** — none implemented. `docs/SECURITY.md` marks these "Planned," not
  "Implemented" — the version you were shown earlier overstated this.
- **Object-level authorization (IDOR checks)** — cannot exist yet because
  the endpoints they'd protect don't exist.
- **Anonymous-visibility identity hiding** — same: not implemented, no
  Problems controller yet.
- **Payments/Stripe integration** — not implemented; only placeholder env
  vars exist.
- **`packages/ui`** — empty. `Card.tsx`/`Badge.tsx` currently live only in
  `apps/web/components/ui`, not in the shared package, so nothing outside
  `apps/web` can use them yet.
- **Terraform `db_password`** — the version you sent had a real-looking
  password hardcoded in `main.tf`. I changed it to a required `sensitive`
  Terraform variable (`TF_VAR_db_password` or a secrets backend) instead,
  since committing that value would defeat the point of Terraform state
  security. You must supply this value out-of-band before `terraform
  apply` will run.
- **No database migrations** — the Prisma schema exists, but nobody has
  run `prisma migrate dev` to generate the actual SQL migration files, so
  `services/api/prisma/migrations/` doesn't exist yet.
- **No lockfile** — `pnpm install` has not been run in this environment,
  so there's no `pnpm-lock.yaml` yet; the first `pnpm install` you run
  will generate one — commit it.
- **`Dockerfile.api`** — written but never built/tested here (no network
  access in this environment); expect to debug it on first build.

## Suggested next steps, in order

1. `pnpm install` locally and confirm it resolves cleanly.
2. Implement `AuthModule` first (signup, login, refresh, email
   verification) — almost everything else depends on having real users
   and real JWTs to test against.
3. Implement `ProblemsModule` and `ListingsModule` CRUD, with ownership
   checks from day one (don't bolt them on later).
4. Add a `MatchingController` that calls the existing `MatchingService`.
5. Run `prisma migrate dev --name init` and commit the generated
   migration.
6. Only then start treating `docs/SECURITY.md` as a checklist to tick
   off — with real tests proving each control, not just code that looks
   like it does the right thing.

If you hand this repository to an AI coding agent, point it at
`MASTER_AI_BUILD_PROMPT.md` and this file together, so it builds the
missing pieces instead of assuming they already exist.
