import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../common/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatus } from '@prisma/client';

const ALLOWED_STATUS_TRANSITIONS: Record<string, RequestStatus[]> = {
  PENDING: [RequestStatus.ACCEPTED, RequestStatus.DECLINED],
  ACCEPTED: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
};

@Controller('requests')
@UseGuards(AuthGuard('jwt'))
export class RequestsLeadsController {
  constructor(private prisma: PrismaService) {}

  // Seeker contacts a solver about a listing, in the context of a specific
  // problem they own.
  @Post()
  async createRequest(@Req() req: any, @Body() dto: CreateRequestDto) {
    if (!req.user.seekerProfileId) {
      throw new ForbiddenException('Only registered Seekers can send requests');
    }

    // SECURITY: verify the problem actually belongs to this seeker — the
    // same class of check we added to ProblemsController. Without this, a
    // seeker could send a request "as" a problem they don't own by simply
    // guessing/enumerating problem ids.
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId },
    });
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    if (problem.seekerId !== req.user.seekerProfileId) {
      throw new ForbiddenException('You can only send requests for your own problems');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.prisma.request.create({
      data: {
        problemId: dto.problemId,
        listingId: dto.listingId,
        seekerId: req.user.seekerProfileId,
        solverId: listing.solverId,
        message: dto.message,
        status: RequestStatus.PENDING,
      },
    });
  }

  // Seeker: requests they've sent.
  @Get('sent')
  async getSentRequests(@Req() req: any) {
    if (!req.user.seekerProfileId) {
      throw new ForbiddenException('Only registered Seekers can view sent requests');
    }
    return this.prisma.request.findMany({
      where: { seekerId: req.user.seekerProfileId },
      include: { listing: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Solver: requests they've received.
  @Get('inbox')
  async getInboxRequests(@Req() req: any) {
    if (!req.user.solverProfileId) {
      throw new ForbiddenException('Only registered Solvers can view their inbox');
    }
    return this.prisma.request.findMany({
      where: { solverId: req.user.solverProfileId },
      include: {
        problem: { select: { title: true, description: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Solver: accept/decline/complete/cancel a request they own.
  @Patch(':id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') newStatus: RequestStatus,
  ) {
    if (!req.user.solverProfileId) {
      throw new ForbiddenException('Only registered Solvers can update request status');
    }

    const existing = await this.prisma.request.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Request not found');
    }
    // SECURITY: object-level check — a solver can only update requests
    // addressed to them, never another solver's request by guessing an id.
    if (existing.solverId !== req.user.solverProfileId) {
      throw new ForbiddenException('You can only update your own requests');
    }

    const allowedNext = ALLOWED_STATUS_TRANSITIONS[existing.status] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${newStatus}`,
      );
    }

    return this.prisma.request.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}
