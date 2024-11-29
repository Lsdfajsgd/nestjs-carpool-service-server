// reviews.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewsRepository } from './repositories/reviews.repository';
import { ReviewsEntity } from './entities/reviews.entity';
import { Repository } from 'typeorm';
import { Users } from '../auth/entities/users.entity';
import { TripsEntity } from '../matching/entities/trips.entity';
import { RideRequestsEntity } from '../matching/entities/ride-requests.entity';
import { RidePassengersEntity } from '../matching/entities/ride-passengers.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(
        private readonly reviewsRepository: ReviewsRepository,
        @InjectRepository(Users)
        private readonly usersRepository: Repository<Users>,
        @InjectRepository(TripsEntity)
        private readonly tripsRepository: Repository<TripsEntity>,
        @InjectRepository(RideRequestsEntity)
        private readonly rideRequestsRepository: Repository<RideRequestsEntity>,
        @InjectRepository(RidePassengersEntity)
        private readonly ridePassengersRepository: Repository<RidePassengersEntity>,
    ) { }

    async createReview(createReviewDto: CreateReviewDto, user: Users): Promise<ReviewsEntity> {
        const { rideRequestId, rating } = createReviewDto;

        const trip = await this.tripsRepository.findOne({
            where: { rideRequest: { id: rideRequestId } },
            relations: ['rideRequest'],
        });

        if (!trip) {
            throw new BadRequestException('Trip을 찾을 수 없습니다.');
        }

        const rideRequest = trip.rideRequest;

        // ride_request의 stauts가 completed인지 확인
        if (rideRequest.status !== 'completed') {
            throw new BadRequestException('ride_request가 completed가 아닙니다.');
        }

        // driver 정보를 가져오기
        const rideRequestWithDriver = await this.rideRequestsRepository.findOne({
            where: { id: rideRequestId },
            relations: ['driver'],
        });

        if (!rideRequestWithDriver || !rideRequestWithDriver.driver) {
            throw new BadRequestException('운전자를 찾을 수 없습니다.');
        }

        // 리뷰어가 passenger인지 확인
        const isPassenger = await this.ridePassengersRepository.findOne({
            where: { rideRequest: { id: rideRequest.id }, passenger: { id: user.id } },
        });
        if (!isPassenger) {
            throw new BadRequestException('해당 ride_request의 passenger만 리뷰를 작성할 수 있습니다.');
        }

        // 기존 리뷰가 있는지 확인
        const existingReview = await this.reviewsRepository.findExistingReview(rideRequestId, user.id);
        if (existingReview) {
            throw new BadRequestException('이미 리뷰를 작성 했습니다.');
        }

        if (rideRequestWithDriver.driver.id !== trip.rideRequest.driverId) {
            throw new BadRequestException('리뷰 대상 운전자가 올바르지 않습니다.');
        }

        // 리뷰생성
        const review = this.reviewsRepository.create({
            match: trip,
            reviewer: user,
            target: rideRequestWithDriver.driver,
            rating,
        });
        return this.reviewsRepository.save(review);
    }

    async getDriverReviews(driverId: number): Promise<{ reviews: { reviewer: string, rating: number, createdAt: Date }[], averageRating: number }> {
        // id가 driver인지 확인 
        const driver = await this.usersRepository.findOne({ where: { id: driverId } });
        if (!driver || driver.role !== 'driver') {
            throw new BadRequestException('요청한 ID는 driver가 아닙니다.');
        }

        // 특정 드라이버의 모든 트립을 가져오기
        const trips = await this.tripsRepository.find({
            where: { rideRequest: { driverId } },
            relations: ['rideRequest'],
        });

        // 모든 트립의 ride_request 상태가 completed인지 확인
        const incompleteTrip = trips.find(trip => trip.rideRequest.status !== 'completed');
        if (incompleteTrip) {
            throw new BadRequestException('ride_request의 상태가 completed가 아닙니다.');
        }

        // 리뷰 가져오기
        const reviews = await this.reviewsRepository.find({
            where: { target: { id: driverId } },
            relations: ['reviewer'], // Include reviewer information
        });

        const transformedReviews = reviews.map(review => ({
            reviewer: review.reviewer.username, // assuming 'username' exists
            rating: review.rating,
            createdAt: review.created_at,
        }));

        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        return { reviews: transformedReviews, averageRating };
    }
}
