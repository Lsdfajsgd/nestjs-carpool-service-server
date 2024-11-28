import { DataSource, Repository } from 'typeorm';
import { ReviewsEntity } from '../entities/reviews.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsRepository extends Repository<ReviewsEntity> {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {
        super(ReviewsEntity, dataSource.createEntityManager());
    }

    

    // 특정 Trip의 리뷰 가져오기
    async findByTripId(tripId: number): Promise<ReviewsEntity[]> {
        return this.find({
            where: { match: { id: tripId } },
            relations: ['reviewer', 'target'], // 관계 데이터 포함
        });
    }

    // 특정 사용자가 작성한 리뷰 가져오기
    async findByReviewerId(userId: number): Promise<ReviewsEntity[]> {
        return this.find({
            where: { reviewer: { id: userId } },
            relations: ['match', 'target'], // 관계 데이터 포함
        });
    }

    // 특정 사용자가 받은 리뷰 가져오기
    async findByTargetId(userId: number): Promise<ReviewsEntity[]> {
        return this.find({
            where: { target: { id: userId } },
            relations: ['match', 'reviewer'], // 관계 데이터 포함
        });
    }

    // 특정 Trip과 Reviewer 조합으로 리뷰 중복 확인
    async findExistingReview(rideRequestId: number, reviewerId: number): Promise<ReviewsEntity | null> {
        return this.findOne({
            where: { match: { rideRequest: { id: rideRequestId } }, reviewer: { id: reviewerId } },
            relations: ['match', 'reviewer', 'match.rideRequest'], // 필요한 관계 포함
        });
    }
}
