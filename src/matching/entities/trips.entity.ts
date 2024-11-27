// trips.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { RideRequestsEntity } from './ride-requests.entity';

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
}