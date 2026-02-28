import { IsNumber, IsIn, IsOptional, IsString, Min } from 'class-validator';

export class AdjustBalanceDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(['add', 'subtract'])
  operation: 'add' | 'subtract';

  @IsString()
  @IsOptional()
  reason?: string;
}
