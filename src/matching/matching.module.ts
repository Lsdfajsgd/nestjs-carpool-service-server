import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { JwtConfigModule } from "../jwt-config/jwt-config.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersRepository } from "../auth/repositories/users.repository";
import { JwtStrategy } from "../auth/jwt.strategy";
import { RideRequestsRepository } from "./repositories/ride-requests.repository";
import { RidePassengersRepository } from "./repositories/ride-passengers.repository";
import { VehicleInfoRepository } from "../auth/repositories/vehicle-info.repository";
import { TripsRepository } from "./repositories/trips.repository";

@Module({
  imports: [
    JwtConfigModule,
    TypeOrmModule.forFeature([UsersRepository]),
    TypeOrmModule.forFeature([RideRequestsRepository]),
    TypeOrmModule.forFeature([RidePassengersRepository]),
    TypeOrmModule.forFeature([VehicleInfoRepository]),
    TypeOrmModule.forFeature([TripsRepository])
  ],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    UsersRepository,
    RideRequestsRepository,
    RidePassengersRepository,
    VehicleInfoRepository,
    TripsRepository,
    JwtStrategy
  ]
})
export class MatchingModule {}

