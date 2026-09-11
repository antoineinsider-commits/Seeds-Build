# API Reference (stub)

No controllers are implemented yet — see `BUILD_NOTES.md`. Once
endpoints exist, document them here (or generate an OpenAPI/Swagger spec
from the NestJS app with `@nestjs/swagger` and link it from this file).

Planned surface, per `MASTER_AI_BUILD_PROMPT.md` Section 8:

- `POST /api/v1/auth/signup`, `/login`, `/refresh`, `/logout`
- `POST /api/v1/problems`, `GET /api/v1/problems/:id`
- `GET /api/v1/matching/:problemId` — implemented in `MatchingService`,
  not yet exposed by a controller
- `GET/POST /api/v1/listings`
- `POST /api/v1/requests`, `POST /api/v1/proposals`
- `POST /api/v1/reviews`
- `POST /api/v1/billing/checkout-session`, webhook handler
- `/api/v1/admin/*` moderation and analytics endpoints
