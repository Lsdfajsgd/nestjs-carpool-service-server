import { DataSource, Repository } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VehicleRepository extends Repository<Vehicle> {
    constructor(private dataSource: DataSource) {
        super(Vehicle, dataSource.createEntityManager());
    }
    async findVehicleByUserId(userId: number): Promise<Vehicle | null> {
        //차량정보 엔티티의 연결된 user기준으로 id탐색해서 그게 userId인 객체를 탐색 후  반환
        return this.findOne({
            where: { userId },
            select: ['vehicleModel', 'licensePlate', 'seatingCapacity'],
        });
    }
}