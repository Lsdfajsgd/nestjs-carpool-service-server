import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn, OneToOne,
} from 'typeorm';
import { UserRole } from './dto/user-role.enum';
import { Profile } from './profile.entity';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email', type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar' })
  password: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'phone_number', type: 'varchar', nullable: true })
  phoneNumber: string;

  @Column({ name: 'role', type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'points', type: 'int', default: 0 })
  points: number;

  @Column({ name: 'penalty_point', type: 'int', default: 0 })
  penaltyPoint: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ name: 'refresh_token', type: 'varchar', nullable: true })
  refreshToken: string | null;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;
}