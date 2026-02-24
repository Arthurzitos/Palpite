import { IsMongoId, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class CreateBetDto {
  @IsMongoId()
  @IsNotEmpty()
  eventId: string;

  @IsMongoId()
  @IsNotEmpty()
  outcomeId: string;

  @IsNumber()
  @Min(1)
  @Max(10000)
  amount: number;
}
