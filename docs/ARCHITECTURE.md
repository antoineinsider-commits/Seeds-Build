# SEEDS Architecture Specification

## Monolith to Microservices Roadmap
SEEDS is structured as a **Modular Monolith** within `services/api`. Boundaries are maintained via strict NestJS modules (`ProblemsModule`, `MatchingModule`, `ListingsModule`).

When scaling requires functional decomposition:
1. **Matching Service Extraction**: Extract `MatchingModule` into a standalone gRPC/REST worker process listening to problem-creation events on Redis Pub/Sub or Kafka.
2. **Read/Write Path Separation**: Write requests hit the transactional PostgreSQL primary instance. Search/Browse endpoints route exclusively through `pgvector` or OpenSearch indices.

## System Topology

```
       +-----------------------+
       |   Next.js Web App     |
       +-----------+-----------+
                    |
                    v
      +-------------+-------------+
      | NestJS Modular Monolith   |
      +------+--------------+-----+
             |              |
             v              v
  +----------+----+    +---+------------+
  | PostgreSQL +  |    | Redis Session  |
  | pgvector      |    | & Rate Limits  |
  +---------------+    +----------------+
```
