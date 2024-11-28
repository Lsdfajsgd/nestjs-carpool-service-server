import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // TypeORM 모듈 추가
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsEntity } from './entities/reviews.entity'; // Reviews 엔티티
import { TripsEntity } from '../matching/entities/trips.entity'; // Trips 엔티티
import { Users } from '../auth/entities/users.entity'; // Users 엔티티
import { ReviewsRepository } from './repositories/reviews.repository'; // Reviews Repository
import { TripsRepository } from '../matching/repositories/trips.repository'; // Trips Repository

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewsEntity, TripsEntity, Users]), // 엔티티 주입
  ],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    ReviewsRepository, // Repository 추가
    TripsRepository,
  ],
  exports: [ReviewsService], // 필요시 다른 모듈에서 사용할 수 있도록 export
})
export class ReviewsModule {}
