import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Used on endpoints that are publicly reachable but need to know WHO is
// asking (to decide what to reveal), as opposed to WHETHER anyone may ask
// at all. Unlike the default AuthGuard('jwt'), this never blocks the
// request when no token (or an invalid one) is present — it just leaves
// req.user unset. The controller is responsible for treating req.user as
// untrusted/absent and applying its own visibility rules.
//
// Implementation note: NestJS's AuthGuard.canActivate() returns whatever
// handleRequest() returns, and treats a falsy return value as "deny
// access" — so handleRequest alone can't both "not throw" AND "allow
// through with no user" at the same time. We have to override
// canActivate() itself to always resolve true, and swallow the auth
// error that (correctly) still gets thrown internally for a missing/bad
// token when no user is found.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Never throw here — an absent/invalid token is a valid, anonymous
    // request for this guard's purposes. Just don't attach a user.
    return user || undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // No valid token — proceed as anonymous rather than rejecting.
    }
    return true;
  }
}
