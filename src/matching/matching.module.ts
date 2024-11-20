import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidePassengersEntity } from '../matching/ride-passengers.entity';
import { RideRequestsEntity } from '../matching/ride-requests.entity';
import { ChatModule } from 'src/chat/chat.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([RideRequestsEntity, RidePassengersEntity]),
    ChatModule
  ],
  controllers: [MatchingController],
  providers: [MatchingService]
})
export class MatchingModule {}
