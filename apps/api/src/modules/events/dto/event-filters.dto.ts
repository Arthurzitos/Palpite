import { IsEnum, IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { EventCategory, EventStatus } from '@prediction-market/shared';

export type SortFilter = 'live' | 'trending' | 'popular' | 'new';

export class EventFiltersDto {
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['live', 'trending', 'popular', 'new'])
  @IsOptional()
  filter?: SortFilter;

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
