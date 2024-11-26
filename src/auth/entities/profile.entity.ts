// src/profiles/profile.entity.ts
import {
<<<<<<< HEAD
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from "./users.entity";
import { VehicleInfo } from "./vehicle-info.entity";

@Entity('profiles')
export class Profile extends BaseEntity {
  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId: number;

  @OneToOne(() => Users, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({
    name: 'profile_picture',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  profilePicture: string;

  @Column({
    name: 'bio',
    type: 'text',
    nullable: true,
  })
  bio: string;

  // @OneToOne(() => VehicleInfo, { nullable: true, onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'user_id' })
  // vehicle: VehicleInfo | null;
}
=======
    BaseEntity,
    Column,
    Entity,
    PrimaryColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';

@Entity('profiles')
export class Profile extends BaseEntity {
    @PrimaryColumn({ name: 'user_id', type: 'int' })
    userId: number;

    @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        name: 'profile_picture',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    profilePicture: string;

    @Column({
        name: 'bio',
        type: 'text',
        nullable: true,
    })
    bio: string;

    @OneToOne(() => Vehicle, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    vehicle: Vehicle | null;
}
>>>>>>> devlop
