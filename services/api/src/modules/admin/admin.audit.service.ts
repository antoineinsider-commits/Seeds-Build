import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

export type AdminAuditAction =
  | 'LISTING_VERIFIED'
  | 'LISTING_REJECTED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'USER_VERIFICATION_UPDATED';

@Injectable()
export class AdminAuditService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async record(params: {
    adminId: string;
    action: AdminAuditAction;
    targetId: string;
    details: Record<string, unknown>;
  }) {
    return this.prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetId: params.targetId,
        details: params.details as Prisma.InputJsonValue,
      },
    });
  }
}