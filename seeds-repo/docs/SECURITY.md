# SEEDS Platform Security Verification Checklist

> "Implemented" below means: the control exists in code and was reviewed
> for correctness against its stated design. It is **not** the result of
> an external penetration test or a formal audit — don't represent it as
> one.

| Security Requirement | Status | Implementation Details |
|---|---|---|
| **Public signup role restriction** | ✅ Implemented | `SignupDto.role` is constrained to `SEEKER`/`SOLVER` via `@IsIn(PUBLIC_SIGNUP_ROLES)`. `ADMIN`/`SUPER_ADMIN` cannot be created through the public signup endpoint. |
| **No hardcoded/fallback signing secret** | ✅ Implemented | `JwtStrategy` and `AuthModule`'s `JwtModule.registerAsync` both throw at construction if `JWT_SECRET` is unset — no fallback value exists anywhere in the codebase. `main.ts` also fails fast at boot if `JWT_SECRET`/`JWT_REFRESH_SECRET`/`DATABASE_URL` are missing. |
| **Password Hashing** | ✅ Implemented | via `bcrypt` (cost factor 12) in `AuthService.signup`. Plaintext passwords are never logged or persisted. |
| **JWT Session Security** | ✅ Implemented | Access tokens expire in 15 minutes. Refresh tokens are SHA-256 hashed, rotated on each use, and reuse of an already-revoked token now revokes **all** of that user's refresh tokens (compromise response), not just a silent rejection. |
| **Role-Based Access Control (RBAC)** | ✅ Implemented | Server-side validation via `RolesGuard` and `@UseGuards(AuthGuard('jwt'))`. |
| **Object-Level Authorization (IDOR) — Problem creation** | ✅ Implemented | `ProblemsController.createProblem` uses the authenticated JWT's `seekerProfileId`, never a client-supplied id, and validates the request body via `CreateProblemDto`. |
| **Object-Level Authorization (IDOR) — Problem visibility** | ✅ Implemented | `PRIVATE` problems now require the requester to be the owning seeker or an admin (`OptionalJwtAuthGuard` + an explicit check in `getProblem`); unauthorized requests get a 404, not a 403, to avoid confirming existence. `ANONYMOUS` masks seeker identity as before. **Still missing:** a matched-solver exception once Requests/Leads exist. |
| **Input validation on Problem creation** | ✅ Implemented | `CreateProblemDto` replaces the previous `body: any`, with length limits, array-size limits, and enum checks. |
| **Rate limiting — global** | ✅ Implemented | `ThrottlerGuard` at 100 requests/minute app-wide. |
| **Rate limiting — auth endpoints** | ✅ Implemented | `AuthController` applies stricter per-route limits (5/min signup, 10/min login and refresh) on top of the global limit. Currently keyed by IP only — no per-account lockout yet. |
| **Generic error responses in production** | ✅ Implemented | `AllExceptionsFilter` catches everything; outside `NODE_ENV=production` it shows real error messages for debugging, in production it returns a generic message and logs full detail server-side only. |
| **Correct client-IP detection behind a proxy/load balancer** | ✅ Implemented | `app.set('trust proxy', 1)` in `main.ts`, required for `ThrottlerGuard` (and any future IP-based logic) to see real client IPs instead of the proxy's. |
| **Security headers** | ✅ Implemented | `SecurityHeadersMiddleware` sets `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, and a `default-src 'none'` CSP (this is a JSON API, not an HTML-serving app). |
| **Database Parameterization** | ✅ Implemented | All queries run through the Prisma ORM; zero dynamic SQL concatenation. |
| **Terraform Secrets Security** | ✅ Implemented | Hardcoded RDS password removed; supplied via `TF_VAR_db_password` at apply time instead. |
| **Seed script production guard** | ✅ Implemented | `prisma/seed.ts` refuses to run when `NODE_ENV=production`, since it creates known-password accounts including an admin. |
| **Object-level auth on Listings/Requests/Proposals/Reviews/Billing/Admin** | ❌ Not yet implemented | Those modules are still empty stubs — see `BUILD_NOTES.md`. |
| **Email verification** | ❌ Not yet implemented | `isEmailVerified` is set `true` unconditionally at signup as an MVP shortcut; treat it as meaningless until a real flow exists. |
| **Per-account (not just per-IP) brute-force protection on login** | ⚠️ Partial | Per-IP throttling exists; an attacker distributing guesses across many IPs against one account isn't slowed by it yet. Consider account-level lockout/backoff as a follow-up. |