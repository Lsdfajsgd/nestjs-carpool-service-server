import { DataSource, Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VehicleRepository extends Repository<Vehicle> {
    constructor(private dataSource: DataSource) {
        super(Vehicle, dataSource.createEntityManager());
    }
    async findVehicleByUserId(userId: number): Promise<Vehicle | null> {
        return this.findOne({
            where: { userId },
            select: ['vehicleModel', 'licensePlate', 'seatingCapacity'],
        });
    }
}