import { DataSource, Repository } from "typeorm";
import { RidePassengersEntity } from "../entities/ride-passengers.entity";
import { Injectable } from "@nestjs/common";
<<<<<<< HEAD
import { Users } from "../../auth/entities/users.entity";
=======
import { User } from "../../auth/entities/user.entity";
>>>>>>> devlop
import { RideRequestsEntity } from "../entities/ride-requests.entity";
import { InjectDataSource } from "@nestjs/typeorm";

@Injectable()
export class RidePassengersRepository extends Repository<RidePassengersEntity> {
<<<<<<< HEAD
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    super(RidePassengersEntity, dataSource.createEntityManager());
  }

  /**
   * 특정 라이드 요청 ID에 속한 탑승자 목록을 찾는 메서드
   */
  async findByRideRequestId(rideRequestId: number): Promise<RidePassengersEntity[]> {
    return this.find({ where: { rideRequest: { id: rideRequestId } }, relations: ["rideRequest", "passenger"] });
  }

  /**
   * 특정 탑승자 ID로 라이드 요청을 찾는 메서드
   */
  async findByPassengerId(passengerId: number): Promise<RidePassengersEntity | null> {
    return this.findOne({ where: { passenger: { id: passengerId } }, relations: ["rideRequest", "passenger"] });
  }

  /**
   * 탑승자 요청을 데이터베이스에 저장하는 메서드
   */
  async savePassengersForRideRequest(
    savedRideRequest: RideRequestsEntity,
    passengerEntities: Users[],
  ): Promise<void> {
    for (const passenger of passengerEntities) {
      const ridePassenger = this.create({
        passenger,
        rideRequest: savedRideRequest,
        status: 'confirmed',
      });

      await this.save(ridePassenger);
    }

    console.log(`RideRequest ID ${savedRideRequest.id}에 탑승자 정보가 성공적으로 저장되었습니다.`);
  }

  async updateRideRequestForPassenger(
    passengerId: number,
    rideRequestId: number
  ): Promise<void> {
    const ridePassenger = await this.findOne({
      where: { passenger: { id: passengerId } },
    });

    if (!ridePassenger) {
      throw new Error(`Passenger with ID ${passengerId} not found.`);
    }

    ridePassenger.rideRequest = { id: rideRequestId } as RideRequestsEntity; // rideRequest 설정
    await this.save(ridePassenger);

    console.log(`탑승자 ${passengerId}에 대해 RideRequest ID ${rideRequestId}가 설정되었습니다.`);
  }


}
=======
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {
        super(RidePassengersEntity, dataSource.createEntityManager());
    }

    /**
     * 특정 라이드 요청 ID에 속한 탑승자 목록을 찾는 메서드
     */
    async findByRideRequestId(rideRequestId: number): Promise<RidePassengersEntity[]> {
        return this.find({ where: { rideRequest: { id: rideRequestId } }, relations: ["rideRequest", "passenger"] });
    }

    /**
     * 특정 탑승자 ID로 라이드 요청을 찾는 메서드
     */
    async findByPassengerId(passengerId: number): Promise<RidePassengersEntity | null> {
        return this.findOne({ where: { passenger: { id: passengerId } }, relations: ["rideRequest", "passenger"] });
    }

    /**
     * 탑승자 요청을 데이터베이스에 저장하는 메서드
     */
    async savePassengersForRideRequest(
        savedRideRequest: RideRequestsEntity,
        passengerEntities: User[],
    ): Promise<void> {
        for (const passenger of passengerEntities) {
            const ridePassenger = this.create({
                passenger,
                rideRequest: savedRideRequest,
                status: 'confirmed',
            });

            await this.save(ridePassenger);
        }

        console.log(`RideRequest ID ${savedRideRequest.id}에 탑승자 정보가 성공적으로 저장되었습니다.`);
    }

    async updateRideRequestForPassenger(
        passengerId: number,
        rideRequestId: number
    ): Promise<void> {
        const ridePassenger = await this.findOne({
            where: { passenger: { id: passengerId } },
        });

        if (!ridePassenger) {
            throw new Error(`Passenger with ID ${passengerId} not found.`);
        }

        ridePassenger.rideRequest = { id: rideRequestId } as RideRequestsEntity; // rideRequest 설정
        await this.save(ridePassenger);

        console.log(`탑승자 ${passengerId}에 대해 RideRequest ID ${rideRequestId}가 설정되었습니다.`);
    }


}
>>>>>>> devlop
