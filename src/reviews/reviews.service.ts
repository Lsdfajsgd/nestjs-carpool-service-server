import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReviewsRepository } from './repositories/reviews.repository';
import { ReviewsEntity } from './entities/reviews.entity';
import { Repository } from 'typeorm';
import { Users } from '../auth/entities/users.entity';
import { TripsEntity } from '../matching/entities/trips.entity';
import { RideRequestsEntity } from '../matching/entities/ride-requests.entity';
import { RidePassengersEntity } from '../matching/entities/ride-passengers.entity';

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

    async createReview(data: Partial<ReviewsEntity>): Promise<ReviewsEntity> {
        const trip = await this.tripsRepository.findOne({
            where: { rideRequest: { id: data.match.id } },
            relations: ['rideRequest'],
        });

        if (!trip) {
            throw new BadRequestException('Trip을 찾을 수 없습니다.');
        }

        // ride_request 상태 확인 (completed만 허용)
        const rideRequest = trip.rideRequest;
        if (rideRequest.status !== 'completed') {
            throw new BadRequestException('ride_request가 completed가 아닙니다.');
        }

        // 리뷰어가 passenger인지 확인
        const isPassenger = await this.ridePassengersRepository.findOne({
            where: { rideRequest: { id: rideRequest.id }, passenger: { id: data.reviewer.id } },
        });
        if (!isPassenger) {
            throw new BadRequestException('passenger만 리뷰를 작성할 수 있습니다.');
        }

        // 기존 리뷰가 있는지 확인
        const existingReview = await this.reviewsRepository.findExistingReview(trip.id, data.reviewer.id);
        if (existingReview) {
            throw new BadRequestException('이미 쓴 리뷰가 있습니다.');
        }

        // rating 값 검증
        if (data.rating < 1 || data.rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        // 리뷰생성
        const review = this.reviewsRepository.create(data);
        return this.reviewsRepository.save(review);
    }

    async getDriverReviews(driverId: number): Promise<{ reviews: { reviewer: string, rating: number, createdAt: Date }[], averageRating: number }> {
        //id가 driver인지 확인 
        const driver = await this.usersRepository.findOne({ where: { id: driverId } });
        if (!driver || driver.role !== 'driver') {
            throw new BadRequestException('요청한 ID는 driver가 아닙니다.');
        }

        const trips = await this.tripsRepository.find({
            where: { rideRequest: { driverId } },
            relations: ['rideRequest'],
        });

        const incompleteTrip = trips.find(trip => trip.rideRequest.status !== 'completed');
        if (incompleteTrip) {
            throw new BadRequestException('ride_request의 상태가 completed가 아닙니다.');
        }

        const reviews = await this.reviewsRepository.find({
            where: { target: { id: driverId } },
            relations: ['reviewer'], // Include reviewer information
        });

        const transformedReviews = reviews.map(review => ({
            reviewer: review.reviewer.username, // Assuming `name` is a property of the reviewer
            rating: review.rating,
            createdAt: review.created_at,
        }));

        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        return { reviews: transformedReviews, averageRating };
    }
}