// trips.repository.ts

import { DataSource, Repository } from "typeorm";
import { TripsEntity } from '../entities/trips.entity';
import { InjectDataSource } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TripsRepository extends Repository<TripsEntity> {
  // Custom methods can be added here if needed
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super(TripsEntity, dataSource.createEntityManager());
  }
}