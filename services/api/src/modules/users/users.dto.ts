import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AdminUsersQueryDto {
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
  search?: string;

  @IsOptional()
  @IsIn(['SEEKER', 'SOLVER', 'ADMIN', 'SUPER_ADMIN'])
  role?: 'SEEKER' | 'SOLVER' | 'ADMIN' | 'SUPER_ADMIN';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn([
    'UNVERIFIED',
    'PENDING',
    'VERIFIED',
    'REJECTED',
  ])
  verificationStatus?:
    | 'UNVERIFIED'
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED';
}

export class SetUserStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

export class SetUserVerificationDto {
  @IsIn([
    'UNVERIFIED',
    'PENDING',
    'VERIFIED',
    'REJECTED',
  ])
  status!:
    | 'UNVERIFIED'
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED';
}