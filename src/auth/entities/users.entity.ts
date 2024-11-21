import { BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UserRole } from "../dto/user-role.enum";
import { VehicleInfo } from "./vehicle-info.entity";
import { Profile } from "./profile.entity";

@Entity()
@Unique(['username']) // email 유니크는 테스트를 위해 잠시 off
export class Users extends BaseEntity {
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

  @OneToOne(() => VehicleInfo, (vehicleInfo) => vehicleInfo.user, { cascade: true, nullable: true })
  vehicleInfo?: VehicleInfo;

  @Column({ name: 'refresh_token', type: 'varchar', nullable: true })
  refreshToken: string | null;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;


}