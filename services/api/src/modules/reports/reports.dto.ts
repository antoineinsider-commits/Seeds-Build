import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateReportDto {
  @IsIn(['LISTING', 'USER'])
  targetType!: 'LISTING' | 'USER';

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @IsIn([
    'SPAM',
    'SCAM',
    'MISLEADING',
    'INAPPROPRIATE',
    'HARASSMENT',
    'OTHER',
  ])
  reason!:
    | 'SPAM'
    | 'SCAM'
    | 'MISLEADING'
    | 'INAPPROPRIATE'
    | 'HARASSMENT'
    | 'OTHER';

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description!: string;
}

export class AdminReportsQueryDto {
  @IsOptional()
  @IsIn([
    'OPEN',
    'REVIEWING',
    'RESOLVED',
    'DISMISSED',
  ])
  status?:
    | 'OPEN'
    | 'REVIEWING'
    | 'RESOLVED'
    | 'DISMISSED';
}

export class ResolveReportDto {
  @IsIn(['RESOLVED', 'DISMISSED'])
  status!: 'RESOLVED' | 'DISMISSED';

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  resolutionNote!: string;
}