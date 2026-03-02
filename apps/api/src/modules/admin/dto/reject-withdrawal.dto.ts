import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RejectWithdrawalDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
