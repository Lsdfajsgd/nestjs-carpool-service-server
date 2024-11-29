// reviews.controller.ts

import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthGuard } from '@nestjs/passport';
import { Users } from '../auth/entities/users.entity';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    // 리뷰 생성
    @Post()
    @UseGuards(AuthGuard('jwt')) // JWT 인증 Guard 적용
    async createReview(@Body() createReviewDto: CreateReviewDto, @Req() req) {
        const user = req.user;
        await this.reviewsService.createReview(createReviewDto, user);
        return { message: `리뷰 요청을 했습니다.` };
    }

    // 특정 운전자의 리뷰 조회
    @Get('driver/:id')
    @UseGuards(AuthGuard('jwt')) // JWT 인증 Guard 적용
    async getDriverReviews(@Param('id') driverId: number) {
        return this.reviewsService.getDriverReviews(driverId);
    }
}
