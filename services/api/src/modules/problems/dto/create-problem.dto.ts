import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Visibility, SolutionType } from '@prisma/client';

const URGENCY_VALUES = ['Low', 'Medium', 'High'] as const;

export class CreateProblemDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @IsOptional()
  @IsIn(URGENCY_VALUES)
  urgency?: (typeof URGENCY_VALUES)[number];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10_000_000)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10_000_000)
  budgetMax?: number;

  @IsOptional()
  @IsIn(Object.values(Visibility))
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(Object.values(SolutionType))
  preferredSolution?: SolutionType;
}
