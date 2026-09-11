import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../common/prisma.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CreateProblemDto } from './dto/create-problem.dto';
import { Visibility, Role } from '@prisma/client';

@Controller('problems')
export class ProblemsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createProblem(@Req() req: any, @Body() dto: CreateProblemDto) {
    if (!req.user.seekerProfileId) {
      throw new ForbiddenException('Only registered Seekers can submit problems');
    }

    return this.prisma.problem.create({
      data: {
        seekerId: req.user.seekerProfileId,
        title: dto.title,
        description: dto.description,
        industry: dto.industry || 'General',
        urgency: dto.urgency || 'Medium',
        budgetMin: dto.budgetMin ?? 0,
        budgetMax: dto.budgetMax ?? 0,
        visibility: dto.visibility || Visibility.PUBLIC,
        category: dto.category || 'Software & Technology',
        tags: dto.tags || [],
        preferredSolution: dto.preferredSolution,
      },
    });
  }

  // OptionalJwtAuthGuard: this route is publicly reachable (PUBLIC and
  // ANONYMOUS problems must be readable by unauthenticated visitors), but
  // we still need to know who's asking to enforce PRIVATE visibility below.
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getProblem(@Param('id') id: string, @Req() req: any) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: { seeker: true },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    if (problem.visibility === Visibility.PRIVATE) {
      const requester = req.user as
        | { role?: Role; seekerProfileId?: string }
        | null;
      const isOwner = requester?.seekerProfileId === problem.seekerId;
      const isAdmin = requester?.role === Role.ADMIN || requester?.role === Role.SUPER_ADMIN;

      // SECURITY: a real matched-solver exception belongs here once
      // Requests/Leads exist (a solver the problem was actually sent to
      // should also be able to view it). Until then, PRIVATE means
      // owner-or-admin only.
      if (!isOwner && !isAdmin) {
        // 404, not 403 — don't confirm to an unauthorized caller that a
        // private problem with this id even exists.
        throw new NotFoundException('Problem not found');
      }

      return problem;
    }

    if (problem.visibility === Visibility.ANONYMOUS) {
      return {
        ...problem,
        seeker: {
          id: 'anonymous',
          name: 'Anonymous Seeker',
          organization: 'Protected Identity',
        },
      };
    }

    return problem;
  }
}
