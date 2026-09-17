import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportStatus } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AdminReportsQueryDto,
  CreateReportDto,
  ResolveReportDto,
} from './reports.dto';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Post('reports')
  @UseGuards(AuthGuard('jwt'))
  create(
    @Req() req: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(
      req.user.id,
      dto,
    );
  }

  @Get('admin/reports')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getReports(
    @Query() query: AdminReportsQueryDto,
  ) {
    return this.reportsService.getReports(
  query.status as ReportStatus | undefined,
);
  }

  @Get('admin/reports/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getReport(@Param('id') id: string) {
    return this.reportsService.getReport(id);
  }

  @Patch('admin/reports/:id/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  resolve(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolveReport(
      req.user.id,
      id,
      dto,
    );
  }
}