import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AdminModule } from '../admin/admin.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AdminModule],
  controllers: [UsersController],
  providers: [
    PrismaService,
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}