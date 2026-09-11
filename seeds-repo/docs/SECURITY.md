# Security Controls Implementation Matrix

| Security NFR | Status | Technical Implementation & Verification Path |
|---|---|---|
| **Argon2id/Bcrypt Hashing** | Planned | Passwords to be hashed using bcrypt/Argon2id in `AuthService.signup`. Plaintext must never be persisted. `AuthModule` is currently a stub — see BUILD_NOTES.md. |
| **RBAC Enforced Server-Side** | Implemented (guard) | `RolesGuard` decorates NestJS controllers; roles validated from JWT on every request. Requires `AuthModule` to actually issue/validate JWTs — see BUILD_NOTES.md. |
| **Object-Level Auth (IDOR)** | Planned | Problem/Listing mutation endpoints must check `record.ownerId === request.user.id` once those controllers are implemented. |
| **Rate Limiting** | Implemented | NestJS `ThrottlerModule` configured globally (100 reqs/min) in `app.module.ts`. |
| **Anonymous Mode Privacy** | Planned | API must hide `seekerProfile.name` and identifiers when `problem.visibility === 'ANONYMOUS'` — to be implemented in the Problems module. |
| **SQL Injection Prevention** | Implemented | Standardized on Prisma ORM parameterized queries. Zero raw string queries. |
| **Security Headers** | Implemented | `SecurityHeadersMiddleware` applies `X-Frame-Options`, `X-Content-Type-Options`, and strict `HSTS` to all routes. |
| **PCI Compliance** | Planned | No raw card tokens should be handled directly; integrate Stripe Checkout / Elements once the Billing module is implemented. |

> This matrix reflects what currently exists in the repository, not an audited production system. Anything marked **Planned** is a real gap, not a formality — see `BUILD_NOTES.md` for the full list of stubs and what still needs to be implemented and tested before this passes any real security review.
