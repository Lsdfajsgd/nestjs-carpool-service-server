import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { JwtConfigModule } from "../jwt-config/jwt-config.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserRepository } from "../auth/repositories/user.repository";
import { JwtStrategy } from "../auth/jwt.strategy";
import { RideRequestsRepository } from "./repositories/ride-requests.repository";
import { RidePassengersRepository } from "./repositories/ride-passengers.repository";
import { VehicleRepository } from "../auth/repositories/vehicle.repository";

@Module({
  imports: [
    JwtConfigModule,
    TypeOrmModule.forFeature([UserRepository]),
    TypeOrmModule.forFeature([RideRequestsRepository]),
    TypeOrmModule.forFeature([RidePassengersRepository]),
    TypeOrmModule.forFeature([VehicleRepository]),
  ],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    UserRepository,
    RideRequestsRepository,
    RidePassengersRepository,
    VehicleRepository,
    JwtStrategy
  ]
})
export class MatchingModule { }