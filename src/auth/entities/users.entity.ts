import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { UserRole } from "../dto/user-role.enum";
import { VehicleInfo } from "./vehicle-info.entity";
import { Profile } from "./profile.entity";
import { ReviewsEntity } from "src/reviews/entities/reviews.entity";

@Entity('users')
@Unique(['username']) // email 유니크는 테스트를 위해 잠시 off
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email', type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar' })
  password: string;

  @Column({ name: 'username', type: 'varchar', length: 100 })
  username: string;

  @Column({ name: 'phone_number', type: 'varchar', nullable: true })
  phoneNumber: string;

  @Column({ name: 'role', type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'points', type: 'int', default: 0 })
  points: number;

  @Column({ name: 'penalty_point', type: 'int', default: 0 })
  penaltyPoint: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ name: 'refresh_token', type: 'varchar', nullable: true })
  refreshToken: string | null;

  @OneToOne(() => VehicleInfo, (vehicleInfo) => vehicleInfo.user)
  vehicleInfo: VehicleInfo;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  // 작성한 리뷰
  @OneToMany(() => ReviewsEntity, (review) => review.reviewer)
  reviewsWritten: ReviewsEntity[];

  // 받은 리뷰
  @OneToMany(() => ReviewsEntity, (review) => review.target)
  reviewsReceived: ReviewsEntity[];


}