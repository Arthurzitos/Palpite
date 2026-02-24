import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class ResolveEventDto {
  @IsMongoId()
  @IsNotEmpty()
  outcomeId: string;

  @IsString()
  @IsOptional()
  resolutionSource?: string;
}
