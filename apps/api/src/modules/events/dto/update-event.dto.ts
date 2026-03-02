import { IsString, IsEnum, IsOptional, IsDateString, MinLength } from 'class-validator';
import { EventCategory, EventStatus } from '@prediction-market/shared';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  closesAt?: string;
}
