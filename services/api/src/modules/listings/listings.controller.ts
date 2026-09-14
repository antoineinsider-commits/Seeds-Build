import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../common/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { VerificationStatus } from '@prisma/client';

@Controller('listings')
export class ListingsController {
  constructor(private prisma: PrismaService) {}

  // Public: only VERIFIED listings are browsable. Unverified/pending
  // listings should never be exposed here.
  @Get()
  async browseListings(@Query('category') category?: string) {
    return this.prisma.listing.findMany({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
        ...(category ? { category } : {}),
      },
      include: {
        solver: {
          select: { companyName: true, rating: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
      take: 50,
    });
  }

  // Solver: their own listings, including PENDING/REJECTED ones — so they
  // can actually see the status of something they just submitted. Must
  // come before ':id' so it isn't swallowed as a route param.
  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  async getMyListings(@Req() req: any) {
    if (!req.user.solverProfileId) {
      throw new ForbiddenException('Only registered Solvers have listings to list');
    }
    return this.prisma.listing.findMany({
      where: { solverId: req.user.solverProfileId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async getListing(@Param('id') id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        solver: {
          select: { companyName: true, rating: true, bio: true },
        },
      },
    });

    if (!listing || listing.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  // Solver creates a new listing. Starts as PENDING — it will NOT appear
  // in browseListings/getListing/matching results until an admin verifies
  // it. There is no admin UI yet (AdminModule is still a stub), so for now
  // verification has to be done directly in the database:
  //   UPDATE "Listing" SET "verificationStatus" = 'VERIFIED' WHERE id = '...';
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createListing(@Req() req: any, @Body() dto: CreateListingDto) {
    if (!req.user.solverProfileId) {
      throw new ForbiddenException('Only registered Solvers can create listings');
    }

    return this.prisma.listing.create({
      data: {
        solverId: req.user.solverProfileId,
        title: dto.title,
        solutionType: dto.solutionType,
        problemItSolves: dto.problemItSolves,
        targetCustomer: dto.targetCustomer,
        description: dto.description,
        pricingModel: dto.pricingModel,
        priceMin: dto.priceMin,
        priceMax: dto.priceMax,
        deliveryTimeDays: dto.deliveryTimeDays,
        category: dto.category,
        tags: dto.tags || [],
        verificationStatus: VerificationStatus.PENDING,
      },
    });
  }
}
