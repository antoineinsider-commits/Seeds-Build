import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  IsInt,
} from 'class-validator';
import { SolutionType } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsIn(Object.values(SolutionType))
  solutionType!: SolutionType;

  @IsString()
  @MaxLength(2000)
  problemItSolves!: string;

  @IsString()
  @MaxLength(300)
  targetCustomer!: string;

  @IsString()
  @MaxLength(3000)
  description!: string;

  @IsString()
  @MaxLength(50)
  pricingModel!: string;

  @IsNumber()
  @Min(0)
  priceMin!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @IsInt()
  @Min(0)
  deliveryTimeDays!: number;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}
