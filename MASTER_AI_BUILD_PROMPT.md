# MASTER BUILD PROMPT — SEEDS Marketplace Platform (V1)

> Paste this entire document as the system/task prompt to an AI coding agent
> (e.g. Claude Code, Cursor, Devin, GPT-Engineer, etc.) to generate the full
> SEEDS codebase — frontend and backend — as a GitHub-ready repository.
> The full source Product Requirements Document is included at the end of
> this file as an appendix; the AI agent should treat it as the canonical
> product spec and everything above it as build/engineering instructions.

---

## 0. Your role

You are a senior full-stack engineering team (product engineer + backend
engineer + security engineer + DevOps engineer combined). You will design
and generate a complete, production-grade, buildable codebase for **SEEDS**
— a problem-first marketplace — ready to be pushed to GitHub, containerized,
and deployed. Do not produce a prototype or a toy app: assume this needs to
survive real-world traffic, real users, and real attackers from day one.

Work in this order and show your output as actual files in a repository
structure, not just descriptions:

1. Propose the repo structure (monorepo).
2. Scaffold the backend (API, database, auth, business logic).
3. Scaffold the frontend (web app).
4. Wire up infrastructure-as-code, CI/CD, and environment config.
5. Add automated tests (unit, integration, at least a few end-to-end).
6. Add security hardening (see Section 4).
7. Write documentation (README, CONTRIBUTING, ARCHITECTURE, API docs).
8. Summarize what you built, what's stubbed, and what a human must do next
   (e.g., supply real API keys, payment provider credentials, domain, etc.).

If any product decision is ambiguous, use the "Decisions Locked" table in
Section 31 of the PRD (Appendix A) as the source of truth rather than
asking — this document has already made those calls.

---

## 1. Product summary (read Appendix A for full detail)

SEEDS is a **problem-first marketplace**: instead of browsing listings, a
"Problem Seeker" describes a problem in plain language, and SEEDS matches
them to relevant "Solutions" offered by "Problem Solvers" — existing
software/tools, experts/consultants, done-for-you services, knowledge
products (guides/courses/templates), or custom-build proposals.

Core loop:
`Problem submitted → SEEDS understands & categorizes it → Relevant solutions surfaced → Seeker contacts/requests → Solver responds → Problem resolved`

V1 explicitly excludes: physical products, funding/investment, full escrow
payments, native mobile apps, community forums, and a full API ecosystem.
See Appendix A, Sections 7, 21.6, and 31 for the complete in/out-of-scope
list — respect these boundaries; do not gold-plate V1.

---

## 2. Frontend product direction: "Play Store × Fiverr × Upwork"

The frontend should feel like a hybrid of three familiar experiences,
mapped onto SEEDS' problem-first model:

| Borrow from | What to take | Where it shows up in SEEDS |
|---|---|---|
| **Google Play Store** | Clean discovery grid, category browsing, ranked/featured rows, star ratings at a glance, simple detail pages with screenshots, "similar items" rails | "Browse solutions" page, Solution Listing detail pages, category navigation |
| **Fiverr** | Seller/gig-style cards (price, delivery time, seller avatar, rating count), tiered packages, seller profile with portfolio and reviews, "Continue" / "Contact seller" CTA | Solver profile pages, Service & Expert listing cards, pricing display |
| **Upwork** | Structured job/problem posting flow, proposal submission and comparison, client/freelancer dashboards, structured messaging tied to a request, verified badges and job-success style scores | "I have a problem" submission wizard, Custom Build proposals flow, Seeker/Solver dashboards, Request/Lead inbox |

Design requirements:
- Responsive web app first (desktop + mobile web); **no native app in V1**
  (Appendix A §23, §31).
- Use a component library approach (design tokens, reusable Card, Badge,
  Rating, Avatar, Tag, ProgressStep, EmptyState components) so the same
  visual language spans Seeker, Solver, and Admin surfaces.
- Every result card must show a single, unambiguous next action (Contact,
  Request, View Proposal, Compare) per Appendix A §25 principle 3.
- "Featured" placements must always be visibly labeled — never mixed
  invisibly into organic ranking (Appendix A §14.5, §29).
- Support the three problem visibility states in the UI: Public, Private,
  Anonymous-until-accepted (Appendix A §13).
- Empty states, loading states, and error states are required for every
  major screen — do not ship happy-path-only UI.

---

## 3. Non-functional requirements: built to survive real scale

Design and build as if this needs to serve **millions of concurrent users**
without a rewrite. Concretely:

### 3.1 Architecture
- Start as a **modular monolith** with clearly separated domain modules
  (Users/Auth, Problems, Listings, Matching, Requests/Leads, Proposals,
  Reviews, Messaging, Billing, Admin, Notifications) behind clean internal
  interfaces — so any module can be extracted into its own service later
  without a rewrite.
- Stateless application servers behind a load balancer; no in-memory
  session state (use a shared cache/session store).
- Horizontal scalability: the app tier, background workers, and read
  replicas of the database should all be independently scalable.
- Separate the **write path** (problem submission, listing creation) from
  the **read/search path** (browsing, matching results) so heavy read
  traffic (Play-Store-style browsing) never degrades write availability.
- Use a message queue / event bus (e.g. SQS, RabbitMQ, or Kafka) for
  async work: sending emails, indexing new listings for search, computing
  match scores, generating notifications.
- Cache aggressively at the edge (CDN for static assets and images) and at
  the application layer (Redis) for hot reads: listing detail pages,
  category pages, solver profiles, search/match results.
- Database: start with a single primary relational database (PostgreSQL)
  with read replicas; add a dedicated search index (OpenSearch/Elasticsearch
  or Postgres full-text + pgvector for semantic matching) for the matching
  engine described in Appendix A §14, so search load never hits the
  transactional database directly.
- Object storage (S3-compatible) for attachments/media, never the database.
- Design all tables with pagination/cursor-based access from day one —
  no unbounded `SELECT *` list endpoints.
- Include database indexes for every foreign key and every field used in
  filtering/sorting on high-traffic queries (category, industry, urgency,
  budget range, verification level, rating).
- Provide a load-testing plan/script (e.g. k6 or Locust) targeting the
  core loop (submit problem → view matches → contact solver) so scaling
  claims are verifiable, not aspirational.

### 3.2 Reliability
- Health check and readiness/liveness endpoints for every service.
- Graceful degradation: if the matching/search service is down, the app
  should still allow problem submission and queue it for later matching
  rather than hard-failing.
- Idempotency keys on all mutating endpoints that could be retried
  (payments, lead creation, proposal submission).
- Structured logging (JSON), centralized log aggregation, and distributed
  tracing hooks (OpenTelemetry) from the start.
- Automated backups of the primary database with a documented restore
  procedure, and a documented RTO/RPO target.

### 3.3 Observability
- Metrics dashboard covering the funnel metrics in Appendix A §28
  (problems submitted, match rate, contact rate, solver response rate,
  subscription conversion) in addition to standard infra metrics
  (latency, error rate, saturation).
- Error tracking (e.g. Sentry-style) wired into both frontend and backend.
- Alerting thresholds for error-rate spikes, queue backlogs, and elevated
  auth-failure rates (possible credential stuffing).

---

## 4. Security requirements ("must pass a medium-depth security review")

Treat this as a non-negotiable checklist, not aspirational guidance. Build
these in from the start rather than bolting them on later.

### 4.1 AuthN/AuthZ
- Passwords hashed with a modern algorithm (Argon2id or bcrypt, adequate
  cost factor) — never reversible encryption or plain storage.
- Support email/password plus OAuth (Google) sign-in; verify email before
  granting elevated capabilities.
- Session/token model: short-lived access tokens (JWT or opaque) plus
  refresh tokens with rotation and revocation; store refresh tokens
  server-side (or as hashed values) so they can be invalidated.
- Role-based access control (Seeker, Solver, Admin, and sub-roles for
  Admin per Appendix A §20) enforced **server-side on every endpoint**,
  never trusted from the client.
- Object-level authorization checks (a Solver can only edit their own
  listings; a Seeker can only view their own problems and requests unless
  the problem is Public) — test explicitly for IDOR (insecure direct
  object reference) on every resource-by-ID endpoint.
- Rate limiting and lockout/backoff on login, signup, password reset, and
  problem-submission endpoints to blunt brute force and spam.
- Multi-factor authentication support (at least TOTP) for Admin accounts,
  mandatory for anyone with moderation or verification privileges.

### 4.2 Input handling & injection
- Parameterized queries / ORM usage only — no string-concatenated SQL.
- Server-side validation and sanitization of all input (problem text,
  listing content, messages) — validate type, length, and allowed
  characters; reject rather than "clean" malicious payloads where feasible.
- Output encoding everywhere user-generated content is rendered, to
  prevent stored/reflected XSS (problem descriptions, reviews, messages,
  listing descriptions all accept free text and are rendered back to
  other users).
- File upload hardening: restrict MIME types and extensions, re-encode or
  strip metadata from images, scan uploads (attachments on problems and
  portfolios per Appendix A §12 Step 4), enforce size limits, and serve
  uploaded files from a separate cookieless domain/bucket so they can
  never execute as same-origin script.
- CSRF protection on all state-changing requests from browser sessions.
- Strict Content Security Policy, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options`/frame-ancestors, HSTS, and secure/`HttpOnly`/`SameSite`
  cookies.

### 4.3 Data protection
- TLS everywhere (in transit) and encryption at rest for the database and
  object storage.
- PII inventory and minimization: Seeker profiles, Solver verification
  documents, and payment details are sensitive — encrypt sensitive
  verification fields at the column level where practical, and never log
  raw PII or secrets.
- Secrets (DB credentials, API keys, JWT signing keys) loaded from a
  secrets manager / environment variables — never committed to the repo.
  Include a `.env.example` with placeholder values only, and a `.gitignore`
  that excludes real `.env` files.
- Support the Anonymous problem-visibility mode as a real privacy
  guarantee: the Solver must not be able to derive the Seeker's identity
  from the API response until the Seeker accepts contact (Appendix A §13).
- Provide a data-deletion/export path (support GDPR/CCPA-style requests)
  even if the UI for it is admin-triggered in V1.

### 4.4 Platform & dependency security
- Dependency vulnerability scanning in CI (e.g. `npm audit`/`pip-audit`/
  Dependabot or Snyk) that fails the build on high/critical findings.
- Static analysis / linting security rules enabled in CI.
- Container images built from minimal base images, run as non-root, with
  no unnecessary packages.
- Admin dashboard and any internal tooling placed behind additional
  network or auth restrictions (e.g. separate subdomain + MFA + IP
  allowlist option), since it can approve/reject users, verify solvers,
  and moderate content (Appendix A §20).
- Web Application Firewall / basic DDoS mitigation at the edge (e.g. via
  the CDN/load balancer layer) and application-level rate limiting per
  IP/account on all public endpoints, especially problem submission,
  search, and auth.
- Abuse controls for the marketplace itself: CAPTCHA or equivalent bot
  defense on signup and problem submission, spam/profanity filtering on
  public content, and a reporting/flagging pipeline feeding the Admin
  "reported content" queue (Appendix A §20.1).

### 4.5 Payments (Solver subscriptions, Appendix A §15)
- Never handle raw card data directly — integrate a PCI-compliant payment
  processor (e.g. Stripe) via hosted fields/Checkout/Elements, and store
  only the processor's customer/subscription IDs.
- Verify all webhook signatures from the payment provider.
- Reconcile subscription state via webhooks, not just client callbacks.

### 4.6 Verification of security posture
- Include a `SECURITY.md` describing the threat model, reporting process,
  and the controls above.
- Provide a checklist/script that maps each item in this section to where
  it's implemented in the codebase, so a reviewer can audit coverage
  quickly (target: comfortably clear a medium-depth external security
  review/pentest, not just automated scanners).

---

## 5. Suggested technology stack

(Use this as the default; substitute only if you have a strong reason, and
state the reason.)

- **Frontend:** Next.js (React, TypeScript), Tailwind CSS for design
  tokens/theming, React Query or equivalent for data fetching/caching.
- **Backend:** Node.js with NestJS (TypeScript) or a Python
  framework (FastAPI/Django) — pick one and be consistent; TypeScript
  end-to-end (NestJS) is preferred so types can be shared with the
  frontend.
- **Database:** PostgreSQL (primary), Redis (cache, sessions, queues),
  OpenSearch/Elasticsearch or pgvector (search & semantic matching).
- **Object storage:** S3-compatible bucket for attachments/media/portfolio
  files.
- **Auth:** Own auth service using battle-tested libraries (e.g.
  Passport.js/Auth.js or equivalent), not a from-scratch crypto
  implementation.
- **Queue/async:** BullMQ (Redis-backed) or SQS for background jobs
  (email sending, match computation, indexing).
- **Payments:** Stripe (subscriptions + optional Connect for future
  commission model, per Appendix A §15.2 Option 3).
- **Infra:** Docker for all services; docker-compose for local dev;
  Kubernetes or a managed container platform (e.g. ECS/Fargate, Render,
  Railway) for production, chosen for easy horizontal scaling.
- **CI/CD:** GitHub Actions — lint, type-check, test, security-scan,
  build, and deploy pipelines per environment (dev/staging/prod).
- **IaC:** Terraform (or the chosen platform's native IaC) for
  reproducible infrastructure.
- **Monitoring:** OpenTelemetry + a metrics/log backend (e.g.
  Grafana/Loki/Prometheus, or a managed equivalent).

---

## 6. Repository structure to generate

```
seeds/
├── apps/
│   ├── web/                 # Next.js frontend (Seeker, Solver, public pages)
│   └── admin/                # Admin dashboard (can be a route group in web/
│                              # or its own app — your call, document it)
├── services/
│   └── api/                  # Backend API (modular monolith)
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/            # Seeker & Solver profiles
│       │   │   ├── problems/
│       │   │   ├── listings/
│       │   │   ├── matching/
│       │   │   ├── requests-leads/
│       │   │   ├── proposals/
│       │   │   ├── reviews/
│       │   │   ├── messaging/
│       │   │   ├── billing/
│       │   │   ├── admin/
│       │   │   └── notifications/
│       │   ├── common/                # guards, interceptors, pipes, decorators
│       │   └── main.ts
│       ├── test/
│       └── prisma/ (or equivalent)    # schema + migrations
├── packages/
│   ├── ui/                    # Shared component library / design tokens
│   ├── types/                 # Shared TypeScript types/DTOs
│   └── config/                # Shared eslint/tsconfig/etc.
├── infra/
│   ├── docker/
│   ├── terraform/
│   └── k8s/ (if applicable)
├── .github/
│   └── workflows/             # ci.yml, deploy-staging.yml, deploy-prod.yml
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   └── SEEDS_Product_Blueprint_and_V1_PRD.md   # Appendix A, verbatim
├── .env.example
├── docker-compose.yml
├── CONTRIBUTING.md
└── README.md
```

---

## 7. Data model to implement

Implement the following entities (fields summarized; add standard
`id`, `createdAt`, `updatedAt` to all). Full descriptions are in Appendix A
§11.

- **User** (base identity: email, password hash, role, verification status,
  auth provider) — Seeker and Solver profiles extend this.
- **SeekerProfile**: name, email, organization, industry, location,
  notification preferences; relations to submitted Problems, saved
  Listings, contacted Solvers.
- **SolverProfile**: name/company, individual/company type, bio, skills,
  industries, portfolio, verification level, ratings, response time,
  contact settings, location, languages; relation to Listings.
- **Problem**: title, description, industry, business type, user type,
  urgency, budget range, location, desired outcome, preferred resolution
  mode, visibility (public/private/anonymous), status, category/tags,
  attachments, seekerId, matchedSolutions.
- **Listing** (Solution Listing): name, solution type (enum: existing
  solution / expert / knowledge / template-resource / service / custom /
  training / partner / community — flag which are active in V1 per §9.1),
  problem it solves, target customer, description, outcome, pricing model,
  delivery method, media, tags, industries, location, language,
  availability, creatorId, verification status, rating, response time,
  contact/request settings.
- **Request/Lead**: problemId, listingId, seekerId, solverId, message,
  status, responseDeadline, contactExchangeStatus, outcome.
- **Proposal** (for custom builds): problemId, solverId, proposedApproach,
  timeline, price, deliverables, status, messages, attachments.
- **Review**: reviewerId, reviewedPartyId, relatedRequestId, ratings across
  the five dimensions in §18 (responsiveness, professionalism, quality,
  value, likelihood to recommend), comments, verifiedStatus, outcome.
- **Subscription/Plan**: solverId, plan tier (Free/Pro/Business per §15.2),
  status, billing provider IDs.
- **Notification**, **Message/Thread** (structured contact per §19), and
  **AdminAction/AuditLog** (for moderation traceability).

---

## 8. Core API surface to implement (V1)

Group by module; use REST (or GraphQL if you strongly prefer — document
the choice) with consistent pagination, filtering, and error shapes.

- **Auth**: signup, login, refresh, logout, email verification, password
  reset, OAuth callback.
- **Problems**: create (the guided wizard from Appendix A §12), get,
  update, list mine, submit-for-matching, set visibility.
- **Matching**: get matches for a problem (implements the layered model
  in Appendix A §14 — category match, keyword/semantic match, preference
  match, quality ranking).
- **Listings**: create/update/delete (Solver-owned), get, browse/search
  with filters (category, industry, budget, location, verification),
  detail page data.
- **Solver profiles**: create/update, public profile view.
- **Requests/Leads**: create (seeker contacts/requests a listing), list
  (solver inbox, seeker sent), respond, update status.
- **Proposals**: submit (solver), list/compare (seeker), accept/reject.
- **Reviews**: create (post-engagement), list by solver/listing.
- **Messaging**: thread creation tied to a request, send/list messages,
  notification triggers.
- **Billing**: create checkout session, webhook handler, subscription
  status.
- **Admin**: user approval/rejection, listing moderation, verification
  queue, category/tag management, featured-listing management, reports
  queue, analytics endpoints (Appendix A §20).
- **Notifications**: list, mark read, preferences.

---

## 9. MVP feature scope (build this, nothing more, nothing less)

Implement exactly the "Must have" lists in Appendix A §21.1–21.3 for
Seekers, Solvers, and Admin. Treat §21.4 ("Should have") as stretch goals
if time/budget allow after the must-haves are solid and tested. Do **not**
build anything in §21.6 ("Will not have in V1"): physical products,
funding/investors, full escrow payments, native mobile apps, community
forums, partner marketplace, advanced dispute resolution, multi-currency
payouts, or a full API ecosystem.

---

## 10. Testing & quality bar

- Unit tests for all business logic (especially matching/ranking logic
  and authorization checks).
- Integration tests for every API endpoint covering both happy path and
  authorization-failure/validation-failure paths.
- At least one end-to-end test per core journey in Appendix A §22
  (Journeys 1–4).
- Security-focused tests: IDOR attempts, auth-bypass attempts, XSS payload
  round-tripping through free-text fields, rate-limit enforcement.
- CI must run lint + type-check + tests + dependency-vulnerability scan on
  every pull request, and block merge on failure.

---

## 11. Documentation to produce

- **README.md**: what SEEDS is (one paragraph from Appendix A §35), local
  setup instructions, how to run the stack with `docker-compose`, how to
  run tests.
- **ARCHITECTURE.md**: the module boundaries, data flow for the core loop,
  and how the system would scale/split into services later.
- **API.md**: endpoint reference (or generated OpenAPI/Swagger spec).
- **SECURITY.md**: threat model and control checklist (Section 4 above).
- **CONTRIBUTING.md**: branching strategy, commit conventions, how CI
  gates work.

---

## 12. What to hand back when done

1. The full repository as described above, in a working state
   (`docker-compose up` should bring up a usable local environment with
   seed data).
2. A short "Day 2" list: anything you stubbed (e.g., a placeholder
   payment key, a TODO on semantic search embeddings) and what a human
   needs to supply or decide before production launch.
3. Confirmation of which items in the Section 4 security checklist are
   implemented vs. deferred, with reasons for any deferral.

---

## Appendix A — SEEDS Product Blueprint & V1 PRD (source document, verbatim)

*(The complete original document is included as
`docs/SEEDS_Product_Blueprint_and_V1_PRD.md` in this repository/zip. Load
that file's full contents as Appendix A of this prompt before beginning
work — it is the authoritative product specification referenced
throughout this document, covering: user types, the core SEEDS flow,
solution types, "how do you want it solved" logic, the worked restaurant
example, V1 scope and out-of-scope items, the core object model, problem
submission design, problem visibility, the matching engine, business
model & monetization, transaction modes, trust & verification, reviews &
reputation, the communication system, the admin system, the full MVP
feature list, recommended user journeys, platform & screens, home page
messaging, key product principles, recommended launch niche, cold start
strategy, metrics to track, risks & mitigations, the roadmap, locked
decisions, open decisions for stakeholder sign-off, and the final
one-paragraph V1 summary.)*
