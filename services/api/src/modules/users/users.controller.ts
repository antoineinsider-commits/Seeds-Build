import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AdminUsersQueryDto,
  SetUserStatusDto,
  SetUserVerificationDto,
} from './users.dto';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getUsers(@Query() query: AdminUsersQueryDto) {
  return this.usersService.getUsers({
    page: query.page,
    limit: query.limit,
    search: query.search,
    role: query.role,
    isActive: query.isActive,
    verificationStatus: query.verificationStatus,
  });
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/status')
  setUserStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SetUserStatusDto,
  ) {
    return this.usersService.setUserStatus(
      req.user.id,
      id,
      dto.isActive,
    );
  }

  @Patch(':id/verification')
  setUserVerification(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SetUserVerificationDto,
  ) {
    return this.usersService.setUserVerification(
      req.user.id,
      id,
      dto.status,
    );
  }
}