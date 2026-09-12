import { Controller, Get, Param, NotFoundException, Query } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Controller('listings')
export class ListingsController {
  constructor(private prisma: PrismaService) {}

  // Public: only VERIFIED listings are browsable. Unverified/pending
  // listings should never be exposed here — that's a separate authenticated
  // "my listings" view that doesn't exist yet (see BUILD_NOTES.md).
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
}