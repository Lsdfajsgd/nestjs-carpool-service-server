import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { Users } from "./users.entity";

@Entity()
export class VehicleInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'vehicle_model', type: 'varchar' })
  vehicleModel: string;

  @Column({ name: 'license_plate', type: 'varchar' })
  licensePlate: string;

  @Column({ name: 'seating_capacity', type: 'int' })
  seatingCapacity: number;

  //@OneToOne(() => Users, (user) => user.vehicleInfo)
  @OneToOne(() => Users, (user) => user.vehicleInfo)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}
