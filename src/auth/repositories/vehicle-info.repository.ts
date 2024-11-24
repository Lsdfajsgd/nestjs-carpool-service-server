import { DataSource, Repository } from "typeorm";
import { VehicleInfo } from '../entities/vehicle-info.entity';
import { Injectable } from "@nestjs/common";

@Injectable()
export class VehicleInfoRepository extends Repository<VehicleInfo> {
  constructor(private dataSource: DataSource) {
    super(VehicleInfo, dataSource.createEntityManager());
  }

  async findVehicleInfoByUserId(userId: number): Promise<VehicleInfo | undefined> {
    // 챠량정보 엔티티의 연결된 user기준으로 id탐색해서 그게 userId인 객체를 탐색후 반환
    return this.findOne({ where: { userId }, select: ['vehicleModel', 'licensePlate', 'seatingCapacity'], });
  }
}
