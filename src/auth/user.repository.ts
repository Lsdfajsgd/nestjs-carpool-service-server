import { DataSource, Repository } from "typeorm";
import { User } from "./user.entity";
import { Vehicle } from "./vehicle.entity";
import { ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { AuthCredentialDto } from "./dto/auth-credential.dto";
import * as bcrypt from "bcryptjs";
import { Profile } from './profile.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async createUser(authCredentialDto: AuthCredentialDto): Promise<void> {
    const { email, name, password, phoneNumber, role, vehicleInfo } = authCredentialDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.create({
      email,
      name,
      password: hashedPassword,
      phoneNumber,
      role,
      points: 0,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedUser = await queryRunner.manager.save(user);

      const profile = queryRunner.manager.create(Profile, {
        userId: savedUser.id,
        profilePicture: '', // 초기 프로필 사진 URL, 필요시 수정 가능
        bio: '', // 초기 프로필 소개
      });
      await queryRunner.manager.save(profile);

      if (role === "driver" && vehicleInfo) {
        const vehicle = queryRunner.manager.create(Vehicle, {
          userId: savedUser.id,
          vehicleModel: vehicleInfo.model,
          licensePlate: vehicleInfo.licensePlate,
          seatingCapacity: vehicleInfo.seatingCapacity,
        });
        await queryRunner.manager.save(vehicle);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === "23505") {
        throw new ConflictException("Existing username or email");
      } else {
        throw new InternalServerErrorException();
      }
    } finally {
      await queryRunner.release();
    }
  }
}