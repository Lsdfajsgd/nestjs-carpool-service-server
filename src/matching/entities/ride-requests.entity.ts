import {
<<<<<<< HEAD
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn, JoinColumn
} from "typeorm";
import { Users } from "../../auth/entities/users.entity";
=======
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn, JoinColumn
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
>>>>>>> devlop
import { RidePassengersEntity } from "./ride-passengers.entity"; // 유저 엔티티와 연결

@Entity('ride_requests')
export class RideRequestsEntity {
<<<<<<< HEAD
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'driver_id' })
  driverId: number;

  @ManyToOne(() => Users, (user) => user.id, { nullable: false })
  @JoinColumn({ name: 'driver_id' }) // 외래 키 컬럼명 지정
  driver: Users; // 운전자 ID와 관계 설정

  @Column()
  start_location_id: number; // 출발지 ID

  @Column()
  destination_location_id: number; // 목적지 ID

  @Column({ type: "datetime" })
  request_time: Date; // 운전자 요청시간

  @Column()
  limited_passenger_nums: number; // 제한된 탑승 인원 수

  @Column({ type: "enum", enum: ["pending", "matched", "completed", "cancelled"], default: "pending" })
  status: string; // 상태 (enum 타입)

  @OneToMany(() => RidePassengersEntity, (ridePassenger) => ridePassenger.rideRequest)
  passengers: RidePassengersEntity[]; // 탑승자와의 관계

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
=======
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'driver_id' })
    driverId: number;

    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'driver_id' }) // 외래 키 컬럼명 지정
    driver: User; // 운전자 ID와 관계 설정

    @Column()
    start_location_id: number; // 출발지 ID

    @Column()
    destination_location_id: number; // 목적지 ID

    @Column({ type: "datetime" })
    pickup_time: Date; // 픽업 시간

    @Column()
    limited_passenger_nums: number; // 제한된 탑승 인원 수

    @Column({ type: "enum", enum: ["pending", "matched", "completed", "cancelled"], default: "pending" })
    status: string; // 상태 (enum 타입)

    @OneToMany(() => RidePassengersEntity, (ridePassenger) => ridePassenger.rideRequest)
    passengers: RidePassengersEntity[]; // 탑승자와의 관계

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
>>>>>>> devlop
