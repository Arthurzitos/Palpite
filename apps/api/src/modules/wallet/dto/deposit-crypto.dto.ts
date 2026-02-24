import { IsNumber, IsPositive, Min } from 'class-validator';

export class DepositCryptoDto {
  @IsNumber()
  @IsPositive()
  @Min(5, { message: 'Minimum deposit amount is $5' })
  amount: number;
}
