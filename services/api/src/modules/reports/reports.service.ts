import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ReportStatus,
  ReportTargetType,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { AdminAuditService } from '../admin/admin.audit.service';
import {
  CreateReportDto,
  ResolveReportDto,
} from './reports.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async createReport(
    reporterId: string,
    dto: CreateReportDto,
  ) {
    if (dto.targetType === 'LISTING') {
      if (!dto.listingId || dto.reportedUserId) {
        throw new BadRequestException(
          'A listing report requires listingId only',
        );
      }

      const listing =
        await this.prisma.listing.findUnique({
          where: {
            id: dto.listingId,
          },
          select: {
            id: true,
          },
        });

      if (!listing) {
        throw new NotFoundException(
          'Listing not found',
        );
      }
    }

    if (dto.targetType === 'USER') {
      if (!dto.reportedUserId || dto.listingId) {
        throw new BadRequestException(
          'A user report requires reportedUserId only',
        );
      }

      if (dto.reportedUserId === reporterId) {
        throw new BadRequestException(
          'You cannot report your own account',
        );
      }

      const target =
        await this.prisma.user.findUnique({
          where: {
            id: dto.reportedUserId,
          },
          select: {
            id: true,
          },
        });

      if (!target) {
        throw new NotFoundException(
          'Reported user not found',
        );
      }
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        targetType:
          dto.targetType as ReportTargetType,
        listingId:
          dto.targetType === 'LISTING'
            ? dto.listingId
            : null,
        reportedUserId:
          dto.targetType === 'USER'
            ? dto.reportedUserId
            : null,
        reason: dto.reason,
        description: dto.description,
      },
    });
  }

  async getReports(
    status?: ReportStatus,
  ) {
    return this.prisma.report.findMany({
      where: status
        ? {
            status,
          }
        : undefined,

      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },

        reportedUser: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },

        listing: {
          select: {
            id: true,
            title: true,
            verificationStatus: true,
          },
        },

        resolvedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getReport(id: string) {
    const report =
      await this.prisma.report.findUnique({
        where: {
          id,
        },

        include: {
          reporter: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },

          reportedUser: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },

          listing: {
            include: {
              solver: {
                select: {
                  id: true,
                  companyName: true,
                  rating: true,
                  verificationStatus: true,
                },
              },
            },
          },

          resolvedBy: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

    if (!report) {
      throw new NotFoundException(
        'Report not found',
      );
    }

    return report;
  }

  async resolveReport(
    adminId: string,
    id: string,
    dto: ResolveReportDto,
  ) {
    const report =
      await this.prisma.report.findUnique({
        where: {
          id,
        },
      });

    if (!report) {
      throw new NotFoundException(
        'Report not found',
      );
    }

    if (
      report.status === ReportStatus.RESOLVED ||
      report.status === ReportStatus.DISMISSED
    ) {
      throw new ForbiddenException(
        'Report has already been closed',
      );
    }

    const newStatus =
      dto.status === 'RESOLVED'
        ? ReportStatus.RESOLVED
        : ReportStatus.DISMISSED;

    const updated =
      await this.prisma.report.update({
        where: {
          id,
        },

        data: {
          status: newStatus,
          resolutionNote:
            dto.resolutionNote.trim(),
          resolvedById: adminId,
          resolvedAt: new Date(),
        },

        include: {
          reporter: {
            select: {
              id: true,
              email: true,
            },
          },

          reportedUser: {
            select: {
              id: true,
              email: true,
            },
          },

          listing: {
            select: {
              id: true,
              title: true,
            },
          },

          resolvedBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

    await this.auditService.record({
      adminId,

      action:
        newStatus === ReportStatus.RESOLVED
          ? 'REPORT_RESOLVED'
          : 'REPORT_DISMISSED',

      targetId: id,

      details: {
        previousStatus: report.status,
        newStatus,
        targetType: report.targetType,
        listingId: report.listingId,
        reportedUserId:
          report.reportedUserId,
      },
    });

    return updated;
  }
}