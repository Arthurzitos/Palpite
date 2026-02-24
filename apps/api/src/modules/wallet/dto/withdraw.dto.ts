import { IsNumber, IsPositive, Min, IsString, IsNotEmpty } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @IsPositive()
  @Min(10, { message: 'Minimum withdrawal amount is $10' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Wallet address is required' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'Network is required' })
  network: string;
}
