import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import {
  AdminAuditQueryDto,
  SetListingVerificationDto,
} from './admin.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('listings/pending')
  pendingListings() {
    return this.adminService.getPendingListings();
  }

  @Get('listings/:id')
  listingDetails(@Param('id') id: string) {
    return this.adminService.getListingForModeration(id);
  }

  @Patch('listings/:id/verification')
  setListingVerification(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SetListingVerificationDto,
  ) {
    return this.adminService.setListingVerification(
      req.user.id,
      id,
      dto.status,
    );
  }

  @Get('dashboard')
  dashboard() {
    return this.adminService.getDashboard();
  }
  
  @Get('audit-logs')
  auditLogs(@Query() query: AdminAuditQueryDto) {
    return this.adminService.getAuditLogs({
      page: query.page,
      limit: query.limit,
      action: query.action,
      adminId: query.adminId,
    });
  }
}