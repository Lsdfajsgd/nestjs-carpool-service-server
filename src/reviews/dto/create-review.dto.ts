// dto/create-review.dto.ts

import { IsInt, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  rideRequestId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}