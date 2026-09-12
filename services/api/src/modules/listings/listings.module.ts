import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [ListingsController],
  providers: [PrismaService],
})
export class ListingsModule {}