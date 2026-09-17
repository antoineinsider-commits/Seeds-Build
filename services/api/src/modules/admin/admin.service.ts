import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { AdminAuditService } from './admin.audit.service';

type ListingVerificationStatus = 'VERIFIED' | 'REJECTED';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  /**
   * Get all listings waiting for moderation.
   */
  async getPendingListings() {
    return this.prisma.listing.findMany({
      where: {
        verificationStatus: 'PENDING',
      },

      include: {
        solver: {
          select: {
            id: true,
            companyName: true,
            bio: true,
            rating: true,
            verificationStatus: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get one listing for moderation.
   */
  async getListingForModeration(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: {
        id: listingId,
      },

      include: {
        solver: {
          select: {
            id: true,
            companyName: true,
            bio: true,
            rating: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  /**
   * Approve or reject a listing.
   */
  async setListingVerification(
    adminId: string,
    listingId: string,
    status: ListingVerificationStatus,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: {
        id: listingId,
      },

      include: {
        solver: {
          select: {
            id: true,
            companyName: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    /**
     * Only pending listings should go through
     * the initial moderation process.
     */
    if (listing.verificationStatus !== 'PENDING') {
      throw new ForbiddenException(
        `Listing has already been ${listing.verificationStatus.toLowerCase()}`,
      );
    }

    const updated = await this.prisma.listing.update({
      where: {
        id: listingId,
      },

      data: {
        verificationStatus: status,
      },
    });

    await this.auditService.record({
      adminId,

      action:
        status === 'VERIFIED'
          ? 'LISTING_VERIFIED'
          : 'LISTING_REJECTED',

      targetId: listingId,

      details: {
        previousStatus: listing.verificationStatus,
        newStatus: status,
        solverId: listing.solverId,
        solverCompanyName:
          listing.solver?.companyName ?? null,
      },
    });

    return updated;
  }

  /**
   * Get admin audit logs.
   */

  async getDashboard() {
  const [
    totalUsers,
    activeUsers,
    seekers,
    solvers,
    pendingListings,
    verifiedListings,
    openReports,
    recentActivity,
  ] = await this.prisma.$transaction([
    this.prisma.user.count(),

    this.prisma.user.count({
      where: {
        isActive: true,
      },
    }),

    this.prisma.user.count({
      where: {
        role: 'SEEKER',
      },
    }),

    this.prisma.user.count({
      where: {
        role: 'SOLVER',
      },
    }),

    this.prisma.listing.count({
      where: {
        verificationStatus: 'PENDING',
      },
    }),

    this.prisma.listing.count({
      where: {
        verificationStatus: 'VERIFIED',
      },
    }),

    this.prisma.report.count({
      where: {
        status: {
          in: ['OPEN', 'REVIEWING'],
        },
      },
    }),

    this.prisma.adminAuditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        action: true,
        targetId: true,
        details: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive:
        totalUsers - activeUsers,
      seekers,
      solvers,
    },

    listings: {
      pending: pendingListings,
      verified: verifiedListings,
    },

    reports: {
      open: openReports,
    },

    recentActivity,
  };
}

  async getAuditLogs(params: {
    page: number;
    limit: number;
    action?: string;
    adminId?: string;
  }) {
    const {
      page,
      limit,
      action,
      adminId,
    } = params;

    const where: Prisma.AdminAuditLogWhereInput = {
      ...(action ? { action } : {}),
      ...(adminId ? { adminId } : {}),
    };

    const [items, total] =
      await this.prisma.$transaction([
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

          orderBy: {
            createdAt: 'desc',
          },

          skip: (page - 1) * limit,
          take: limit,
        }),

        this.prisma.adminAuditLog.count({
          where,
        }),
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