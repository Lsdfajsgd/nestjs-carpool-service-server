import { DataSource, Repository } from "typeorm";
import { RideRequestsEntity } from "../entities/ride-requests.entity";
import { Injectable } from "@nestjs/common";
import { MatchingRequestDto } from "../dto/matching-request.dto";
import { Users } from "../../auth/entities/users.entity";
import { InjectDataSource } from "@nestjs/typeorm";

@Injectable()
export class RideRequestsRepository extends Repository<RideRequestsEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super(RideRequestsEntity, dataSource.createEntityManager());
  }
  /**
   * 특정 운전자 ID로 라이드 요청을 찾는 메서드
   */
  async findOneByDriverId(driverId: number): Promise<RideRequestsEntity | null> {
    return this.findOne({
      where: { driver: { id: driverId } },
      relations: ["driver", "passengers"],
    });
  }

  /**
   * 특정 상태의 라이드 요청을 찾는 메서드
   */
  async findByStatus(status: string): Promise<RideRequestsEntity[]> {
    return this.find({ where: { status }, relations: ["driver", "passengers"] });
  }

  /**
   * 특정 운전자의 매칭 요청 데이터를 저장하는 메서드
   */
  async saveRideRequest(
    driverEntity: Users,
    driverRequest: MatchingRequestDto,
  ): Promise<RideRequestsEntity> {
    // RideRequest 생성 및 저장
    const rideRequest = this.create({
      driverId: driverEntity.id,
      driver: driverEntity,
      start_location_id: driverRequest.startPoint,
      destination_location_id: driverRequest.endPoint,
      request_time: new Date(driverRequest.requestTime),
      limited_passenger_nums: driverRequest.seatingCapacity || 0,
      status: 'matched',
    });

    return await this.save(rideRequest);
  }
}
