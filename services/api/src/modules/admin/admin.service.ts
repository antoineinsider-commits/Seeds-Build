import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { AdminAuditService } from './admin.audit.service';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async getPendingListings() {
    return this.prisma.listing.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      include: {
        solver: {
          select: {
            companyName: true,
            rating: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setListingVerification(
    adminId: string,
    listingId: string,
    status: VerificationStatus.VERIFIED | VerificationStatus.REJECTED,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: { verificationStatus: status },
    });

    await this.auditService.record({
      adminId,
      action: status === VerificationStatus.VERIFIED
        ? 'LISTING_VERIFIED'
        : 'LISTING_REJECTED',
      targetId: listingId,
      details: {
        previousStatus: listing.verificationStatus,
        newStatus: status,
      },
    });

    return updated;
  }

  async getAuditLogs(params: {
    page: number;
    limit: number;
    action?: string;
    adminId?: string;
  }) {
    const { page, limit, action, adminId } = params;
    const where = {
      ...(action ? { action } : {}),
      ...(adminId ? { adminId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        select: {
          id: true,
          adminId: true,
          action: true,
          targetId: true,
          details: true,
          createdAt: true,
          admin: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
