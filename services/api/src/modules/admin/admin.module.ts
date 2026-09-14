import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin.audit.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [AdminController],
  providers: [
    PrismaService,
    AdminService,
    AdminAuditService,
  ],
})
export class AdminModule {}