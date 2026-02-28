import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prediction-market/shared';

export class UpdateUserDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
