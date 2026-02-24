import { IsEnum, IsOptional, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BetStatus } from '@prediction-market/shared';

export class BetFiltersDto {
  @IsEnum(BetStatus)
  @IsOptional()
  status?: BetStatus;

  @IsMongoId()
  @IsOptional()
  eventId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
