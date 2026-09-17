import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AdminModule } from '../admin/admin.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AdminModule],
  controllers: [ReportsController],
  providers: [
    PrismaService,
    ReportsService,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}