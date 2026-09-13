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

  // NEW: lets a logged-in seeker list their own problems — needed so the
  // frontend can offer "which of my problems is this contact request
  // about" without the seeker having to remember/paste a UUID.
  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  async getMyProblems(@Req() req: any) {
    if (!req.user.seekerProfileId) {
      throw new ForbiddenException('Only registered Seekers have problems to list');
    }
    return this.prisma.problem.findMany({
      where: { seekerId: req.user.seekerProfileId },
      orderBy: { createdAt: 'desc' },
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

      if (!isOwner && !isAdmin) {
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
