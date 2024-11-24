import {DataSource, Repository} from "typeorm";
import {Users} from "../entities/users.entity";
import {ConflictException, Injectable, InternalServerErrorException} from "@nestjs/common";
import {AuthCredentialDto} from "../dto/auth-credential.dto";
import * as bcrypt from 'bcryptjs';
import { UserRole } from "../dto/user-role.enum";
import { VehicleInfo } from "../entities/vehicle-info.entity";
import { Profile } from "../entities/profile.entity";

@Injectable()
export class UsersRepository extends Repository<Users>{
  constructor(private dataSource: DataSource) {
    super(Users, dataSource.createEntityManager());
  }

  async createUser(authCredentialDto: AuthCredentialDto): Promise<void> {
    const {  email , username, password, phoneNumber, role, vehicleInfo } = authCredentialDto;

    // 비밀번호 암호화 작업
    // 유니크한 salt 생성후 비밀번호와 salt 값을 합쳐서 해쉬된 비밀번호를 얻고 그 비밀번호를 데이터베이스에 저장
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.create({
      email,
      username,
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
        const vehicle = queryRunner.manager.create(VehicleInfo, {
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