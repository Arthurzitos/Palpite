import { IsNumber, IsString, IsOptional, Min, MinLength } from 'class-validator';

export class WithdrawRevenueDto {
  @IsNumber()
  @Min(100, { message: 'Minimum withdrawal is $100' })
  amount: number;

  @IsString()
  @MinLength(10, { message: 'Invalid wallet address' })
  withdrawalAddress: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
