// trips.repository.ts

import { DataSource, Repository } from "typeorm";
import { TripsEntity } from '../entities/trips.entity';
import { InjectDataSource } from "@nestjs/typeorm";
import { Injectable , NotFoundException, BadRequestException} from "@nestjs/common";

@Injectable()
export class TripsRepository extends Repository<TripsEntity> {
  // Custom methods can be added here if needed
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super(TripsEntity, dataSource.createEntityManager());
  }

  // 특정 trip의 ride_request_id 상태가 completed인지 확인
  async isRideRequestCompleted(tripId: number): Promise<boolean> {
    const trip = await this.findOne({
      where: { id: tripId },
      relations: ['rideRequest'], // 관련 데이터를 함께 로드
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (!trip.rideRequest ||trip.rideRequest.status !== 'completed') {
      throw new BadRequestException('Ride request is not completed');
    }

    return true; //상대가 completed면 true 반환
  }
}