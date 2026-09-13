import { Module } from '@nestjs/common';
import { RequestsLeadsController } from './requests-leads.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [RequestsLeadsController],
  providers: [PrismaService],
})
export class RequestsLeadsModule {}
