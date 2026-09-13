import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateRequestDto {
  @IsUUID()
  problemId!: string;

  @IsUUID()
  listingId!: string;

  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters' })
  @MaxLength(2000)
  message!: string;
}
