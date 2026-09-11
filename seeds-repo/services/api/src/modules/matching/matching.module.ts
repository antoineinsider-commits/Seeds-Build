import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { PrismaService } from '../../common/prisma.service';

// The MatchingService (matching.service.ts) implements the scored matching
// algorithm. A MatchingController still needs to be added here to expose
// GET /api/v1/matching/:problemId, per MASTER_AI_BUILD_PROMPT.md Section 8.
@Module({
  providers: [MatchingService, PrismaService],
  exports: [MatchingService],
})
export class MatchingModule {}
