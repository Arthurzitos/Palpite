import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventCategory } from '@prediction-market/shared';

export class CreateOutcomeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  label: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsEnum(EventCategory)
  category: EventCategory;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateOutcomeDto)
  outcomes: CreateOutcomeDto[];

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  closesAt: string;
}
