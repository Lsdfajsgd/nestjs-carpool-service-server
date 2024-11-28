// trips.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany} from 'typeorm';
import { RideRequestsEntity } from './ride-requests.entity';
import { ReviewsEntity } from 'src/reviews/entities/reviews.entity';

@Entity('trips')
export class TripsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => RideRequestsEntity)
  @JoinColumn({ name: 'ride_request_id' })
  rideRequest: RideRequestsEntity;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;
  // Reviews와 양방향 관계 설정
  @OneToMany(() => ReviewsEntity, (review) => review.match)
  reviews: ReviewsEntity[];
}