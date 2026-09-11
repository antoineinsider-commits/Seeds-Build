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
# SEEDS Platform Security Verification Checklist

| Security Requirement | Status | Implementation Details |
|---|---|---|
| **Password Hashing** | ✅ Verified | Implemented via `bcrypt` (cost factor 12) in `AuthService.signup`. Plaintext passwords are never logged or persisted. |
| **JWT Session Security** | ✅ Verified | Access tokens expire in 15 minutes. Refresh tokens hashed via SHA-256 and rotated on each refresh. |
| **Role-Based Access Control (RBAC)** | ✅ Verified | Server-side validation executed via `RolesGuard` and `@UseGuards(AuthGuard('jwt'))`. |
| **Object-Level Authorization (IDOR)** | ✅ Verified | Handled at controller tier using authenticated JWT profile IDs (`req.user.seekerProfileId`). |
| **Anonymous Privacy Guarantee** | ✅ Verified | `ProblemsController.getProblem` strips Seeker profile identities on `ANONYMOUS` visibility. |
| **Rate Limiting & DDoS Mitigation** | ✅ Verified | Global `ThrottlerGuard` active at 100 requests per 60 seconds. |
| **Database Parameterization** | ✅ Verified | All queries run through Prisma ORM engine; zero dynamic SQL concatenation. |
| **Terraform Secrets Security** | ✅ Verified | Hardcoded RDS passwords removed. Managed exclusively via `TF_VAR_db_password` environment variable. |