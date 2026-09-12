import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { PrismaService } from '../../common/prisma.service';

// PRIVATE visibility is now enforced (owner or admin only; see
// ProblemsController.getProblem). ANONYMOUS masks identity as before.
// Still missing: a matched-solver exception for PRIVATE once
// Requests/Leads exist — see BUILD_NOTES.md.
@Module({
  controllers: [ProblemsController],
  providers: [PrismaService],
})
export class ProblemsModule {}
