import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsEntity } from './entities/reviews.entity';

@Controller('reviews') // 모든 경로가 /reviews로 시작
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    // 리뷰 생성
    @Post()
    async createReview(@Body() data: Partial<ReviewsEntity>) {
        return this.reviewsService.createReview(data);
    }

    // 특정 운전자의 리뷰 조회
    @Get('driver/:id')
    async getDriverReviews(@Param('id') driverId: number) {
        return this.reviewsService.getDriverReviews(driverId);
    }


}
