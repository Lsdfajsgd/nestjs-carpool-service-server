import {
<<<<<<< HEAD
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { Users } from "../../auth/entities/users.entity";
=======
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
>>>>>>> devlop
import { RideRequestsEntity } from "./ride-requests.entity"; // 라이드 요청과 연결

@Entity('ride_passengers')
export class RidePassengersEntity {
<<<<<<< HEAD
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RideRequestsEntity, (rideRequest) => rideRequest.passengers, { nullable: false })
  rideRequest: RideRequestsEntity; // 라이드 요청 ID와 관계 설정

  @ManyToOne(() => Users, (user) => user.id, { nullable: false })
  passenger: Users; // 탑승자 ID와 관계 설정

  @Column({ type: "enum", enum: ["pending", "confirmed", "cancelled"], default: "pending" })
  status: string; // 상태 (enum 타입)

  @CreateDateColumn()
  created_at: Date;
}
=======
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => RideRequestsEntity, (rideRequest) => rideRequest.passengers, { nullable: false })
    @JoinColumn({name:'ride_request_id'})
    rideRequest: RideRequestsEntity; // 라이드 요청 ID와 관계 설정

    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ name: 'passenger_id' })
    passenger: User; // 탑승자 ID와 관계 설정

    @Column({ type: "enum", enum: ["pending", "confirmed", "cancelled"], default: "pending" })
    status: string; // 상태 (enum 타입)

    @CreateDateColumn()
    created_at: Date;
}
>>>>>>> devlop
