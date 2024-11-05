import {BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique} from "typeorm";
import { UserRole } from "./dto/user-role.enum";

@Entity()
@Unique(['username']) // email 유니크는 테스트를 위해 잠시 off
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;

  // 휴대전화 번호
  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  points : number;

  // 차량 종류
  @Column({ nullable: true })
  vehicleModel?: string;

  // 차량 번호
  @Column({ nullable: true })
  licensePlate?: string;

  // 제한 인원
  @Column({ nullable: true })
  seatingCapacity?: number;


}