import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { JwtConfigModule } from "../jwt-config/jwt-config.module";
import { TypeOrmModule } from "@nestjs/typeorm";
<<<<<<< HEAD
import { UsersRepository } from "../auth/repositories/users.repository";
import { JwtStrategy } from "../auth/jwt.strategy";
import { RideRequestsRepository } from "./repositories/ride-requests.repository";
import { RidePassengersRepository } from "./repositories/ride-passengers.repository";
import { VehicleInfoRepository } from "../auth/repositories/vehicle-info.repository";
import { TripsRepository } from "./repositories/trips.repository";
=======
import { UserRepository } from "../auth/repositories/user.repository";
import { JwtStrategy } from "../auth/jwt.strategy";
import { RideRequestsRepository } from "./repositories/ride-requests.repository";
import { RidePassengersRepository } from "./repositories/ride-passengers.repository";
import { VehicleRepository } from "../auth/repositories/vehicle.repository";
>>>>>>> devlop

@Module({
  imports: [
    JwtConfigModule,
<<<<<<< HEAD
    TypeOrmModule.forFeature([UsersRepository]),
    TypeOrmModule.forFeature([RideRequestsRepository]),
    TypeOrmModule.forFeature([RidePassengersRepository]),
    TypeOrmModule.forFeature([VehicleInfoRepository]),
    TypeOrmModule.forFeature([TripsRepository])
=======
    TypeOrmModule.forFeature([UserRepository]),
    TypeOrmModule.forFeature([RideRequestsRepository]),
    TypeOrmModule.forFeature([RidePassengersRepository]),
    TypeOrmModule.forFeature([VehicleRepository]),
>>>>>>> devlop
  ],
  controllers: [MatchingController],
  providers: [
    MatchingService,
<<<<<<< HEAD
    UsersRepository,
    RideRequestsRepository,
    RidePassengersRepository,
    VehicleInfoRepository,
    TripsRepository,
    JwtStrategy
  ]
})
export class MatchingModule {}
=======
    UserRepository,
    RideRequestsRepository,
    RidePassengersRepository,
    VehicleRepository,
    JwtStrategy
  ]
})
export class MatchingModule { }
>>>>>>> devlop
