# SEEDS

> You bring the problem. SEEDS helps you find the solution.

SEEDS is a problem-first marketplace: instead of browsing listings, a
Problem Seeker describes a problem in plain language, and SEEDS matches
them to relevant solutions offered by Problem Solvers — existing
software, experts, done-for-you services, knowledge products, or custom
builds. See `docs/SEEDS_Product_Blueprint_and_V1_PRD.md` for the full
product spec and `MASTER_AI_BUILD_PROMPT.md` for the engineering brief
this codebase was scaffolded from.

**Read `BUILD_NOTES.md` before you do anything else.** This repository is
an early scaffold, not a finished product — several modules are stubs.

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS — `apps/web`
- **Backend:** NestJS (modular monolith) + Prisma — `services/api`
- **Database:** PostgreSQL with the `pgvector` extension
- **Cache/queues:** Redis
- **Monorepo tooling:** pnpm workspaces

## Local setup

1. Install [Node.js 20+](https://nodejs.org) and pnpm: `npm install -g pnpm`
2. Copy the environment template: `cp .env.example .env` (fill in real
   values for anything beyond local dev — never commit `.env`)
3. Install dependencies: `pnpm install`
4. Start Postgres + Redis (and, once the Dockerfile builds cleanly, the
   API) with `docker-compose up -d postgres redis`
5. Generate the Prisma client and push the schema:
   ```bash
   pnpm --filter @seeds/api exec prisma generate
   pnpm --filter @seeds/api exec prisma db push
   ```
6. Run the API in dev mode: `pnpm dev:api`
7. Run the web app in dev mode: `pnpm dev:web`

## Tests

```bash
pnpm --filter @seeds/api test        # unit tests
pnpm --filter @seeds/api test:e2e    # end-to-end tests (needs Postgres + Redis running)
```

## Repository layout

See `docs/ARCHITECTURE.md` for the full breakdown. At a glance:

- `apps/web` — the Next.js frontend
- `services/api` — the NestJS backend (modular monolith)
- `packages/types`, `packages/ui`, `packages/config` — shared code
- `infra/` — Docker and Terraform
- `docs/` — architecture, security, and product documentation
