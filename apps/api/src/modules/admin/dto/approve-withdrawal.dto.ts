import { IsOptional, IsString } from 'class-validator';

export class ApproveWithdrawalDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
