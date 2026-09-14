import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class SetListingVerificationDto {
  @IsIn([VerificationStatus.VERIFIED, VerificationStatus.REJECTED])
  status!: VerificationStatus;
}

export class AdminAuditQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  adminId?: string;
}
