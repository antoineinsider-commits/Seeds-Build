import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../common/prisma.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Visibility } from '@prisma/client';

@Controller('problems')
export class ProblemsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createProblem(@Req() req: any, @Body() body: any) {
    if (!req.user.seekerProfileId) {
      throw new ForbiddenException('Only registered Seekers can submit problems');
    }

    return this.prisma.problem.create({
      data: {
        seekerId: req.user.seekerProfileId,
        title: body.title,
        description: body.description,
        industry: body.industry || 'General',
        urgency: body.urgency || 'Medium',
        budgetMin: Number(body.budgetMin) || 0,
        budgetMax: Number(body.budgetMax) || 0,
        visibility: body.visibility || Visibility.PUBLIC,
        category: body.category || 'Software & Technology',
        tags: body.tags || [],
        preferredSolution: body.preferredSolution,
      },
    });
  }

  @Get(':id')
  async getProblem(@Param('id') id: string, @Req() req: any) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: { seeker: true },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    // Apply Anonymous Visibility Guard logic
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