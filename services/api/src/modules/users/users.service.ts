import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { AdminAuditService } from '../admin/admin.audit.service';

type UserRole =
  | 'SEEKER'
  | 'SOLVER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

type VerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async getUsers(params: {
    page: number;
    limit: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    verificationStatus?: VerificationStatus;
  }) {
    const {
      page,
      limit,
      search,
      role,
      isActive,
      verificationStatus,
    } = params;

    const where: Prisma.UserWhereInput = {
      ...(search
        ? {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),

      ...(role ? { role } : {}),

      ...(typeof isActive === 'boolean'
        ? { isActive }
        : {}),

      ...(verificationStatus
        ? {
            solverProfile: {
              verificationStatus,
            },
          }
        : {}),
    };

    const [items, total] =
      await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
            mfaEnabled: true,
            createdAt: true,
            updatedAt: true,

            seekerProfile: {
              select: {
                id: true,
              },
            },

            solverProfile: {
              select: {
                id: true,
                companyName: true,
                verificationStatus: true,
                rating: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          skip: (page - 1) * limit,
          take: limit,
        }),

        this.prisma.user.count({
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

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,

        seekerProfile: true,
        solverProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async setUserStatus(
    adminId: string,
    userId: string,
    isActive: boolean,
  ) {
    const target = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    await this.assertCanManageUser(
      adminId,
      target.role,
    );

    const updated = await this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        isActive,
      },

      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditService.record({
      adminId,
      action: isActive
        ? 'USER_ACTIVATED'
        : 'USER_DEACTIVATED',

      targetId: userId,

      details: {
        previousStatus: target.isActive,
        newStatus: isActive,
      },
    });

    return updated;
  }

  async setUserVerification(
    adminId: string,
    userId: string,
    status: VerificationStatus,
  ) {
    const target =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          solverProfile: true,
        },
      });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    await this.assertCanManageUser(
      adminId,
      target.role,
    );

    if (!target.solverProfile) {
      throw new ForbiddenException(
        'Only users with a solver profile can have solver verification status',
      );
    }

    const previousStatus =
      target.solverProfile.verificationStatus;

    const updated =
      await this.prisma.solverProfile.update({
        where: {
          userId,
        },

        data: {
          verificationStatus: status,
        },

        select: {
          id: true,
          userId: true,
          companyName: true,
          verificationStatus: true,
          rating: true,
        },
      });

    await this.auditService.record({
      adminId,
      action: 'USER_VERIFICATION_UPDATED',

      targetId: userId,

      details: {
        previousStatus,
        newStatus: status,
      },
    });

    return updated;
  }

  private async assertCanManageUser(
    adminId: string,
    targetRole: UserRole,
  ) {
    const admin = await this.prisma.user.findUnique({
      where: {
        id: adminId,
      },

      select: {
        role: true,
      },
    });

    if (!admin) {
      throw new ForbiddenException(
        'Administrator account not found',
      );
    }

    if (
      (targetRole === 'ADMIN' ||
        targetRole === 'SUPER_ADMIN') &&
      admin.role !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        'Only a SUPER_ADMIN can manage administrative accounts',
      );
    }
  }
}