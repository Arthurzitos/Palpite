import { IsNumber, IsPositive, Min, Max, IsOptional, IsString } from 'class-validator';

export class DepositFiatDto {
  @IsNumber()
  @IsPositive()
  @Min(5, { message: 'Minimum deposit amount is $5' })
  @Max(3500, { message: 'Maximum fiat deposit is $3500 (KYC limit)' })
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: 'pix' | 'card';
}
