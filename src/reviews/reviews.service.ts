import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewsRepository } from './repositories/reviews.repository';
import { ReviewsEntity } from './entities/reviews.entity';
import { Repository } from 'typeorm';
import { Users } from '../auth/entities/users.entity';
import { TripsEntity } from '../matching/entities/trips.entity';


@Injectable()
export class ReviewsService {
    constructor(
        private readonly reviewsRepository: ReviewsRepository,
        @InjectRepository(Users)
        private readonly usersRepository: Repository<Users>,
        @InjectRepository(TripsEntity)
        private readonly tripsRepository: Repository<TripsEntity>,

    ) { }

    async createReview(data: Partial<ReviewsEntity>): Promise<ReviewsEntity> {
        const trip = await this.tripsRepository.findOne({
            where: { id: data.match.id },
            relations: ['rideRequest'],
        });

        if (!trip) {
            throw new BadRequestException('Trip not found');
        }

        // Step 1: 리뷰어가 passenger인지 확인
        const reviewer = await this.usersRepository.findOne({ where: { id: data.reviewer.id } });
        if (!reviewer || reviewer.role !== 'passenger') {
            throw new BadRequestException('Only passengers can write reviews');
        }

        // Step 2: 대상자가 driver인지 확인
        const target = await this.usersRepository.findOne({ where: { id: data.target.id } });
        if (!target || target.role !== 'driver') {
            throw new BadRequestException('Only drivers can receive reviews');
        }

        // Step 3: 리뷰 생성
        const review = this.reviewsRepository.create(data);
        return this.reviewsRepository.save(review);
    }

    async getDriverReviews(driverId: number): Promise<ReviewsEntity[]> {
        return this.reviewsRepository.find({
            where: { target: { id: driverId } },
            relations: ['reviewer'], // 작성자 정보 포함
        });
    }

    //tripId
    // async getReviewsByTrip(tripId: number): Promise<ReviewsEntity[]> {
    //     return this.reviewsRepository.findByTripId(tripId);
    // }

    // async getReviewsByReviewer(userId: number): Promise<ReviewsEntity[]> {
    //     return this.reviewsRepository.findByReviewerId(userId);
    // }

    // async getReviewsByTarget(userId: number): Promise<ReviewsEntity[]> {
    //     return this.reviewsRepository.findByTargetId(userId);
    // }

}
