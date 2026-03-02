import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TransactionStatus } from '@prediction-market/shared';

export class AdminWithdrawalFiltersDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }) => value || 1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }) => value || 20)
  limit?: number = 20;
}
