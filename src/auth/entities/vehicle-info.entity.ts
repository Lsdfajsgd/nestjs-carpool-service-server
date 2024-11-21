import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Users } from "./users.entity";

@Entity()
export class VehicleInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  model: string;

  @Column()
  licensePlate: string;

  @Column()
  seatingCapacity: number;

  @OneToOne(() => Users, (user) => user.vehicleInfo)
  @JoinColumn()
  user: Users;
}
