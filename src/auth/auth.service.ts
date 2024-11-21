import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {UsersRepository} from "./repositories/users.repository";
import {AuthCredentialDto} from "./dto/auth-credential.dto";
import * as bcrypt from 'bcryptjs';
import {JwtService} from "@nestjs/jwt";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { VehicleInfoRepository } from "./repositories/vehicle-info.repository";
import { Users } from "./entities/users.entity";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private userRepository: UsersRepository,
    @InjectRepository(VehicleInfoRepository)
    private vehicleInfoRepository: VehicleInfoRepository,
    // jwt 서비스 등록
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // 회원가입
  async signUp(authCredentialDto : AuthCredentialDto): Promise<void> {
    return this.userRepository.createUser(authCredentialDto);
  }

  // 로그인
  async signIn(authLoginDto: AuthLoginDto): Promise<{accessToken: string}> {
    const { username, password } = authLoginDto;
    // username으로 fineOne()을 사용해서 해당 유저가 존재하는지 확인후 결과값 user에 저장
    const user = await this.userRepository.findOne({ where: { username }})

    // 해쉬된 비밀번호를 비교하기 위해서 bcrypt의 compare() 메소드사용
    if (user && (await bcrypt.compare(password, user.password))) {
      // 차량 정보 가져오기
      const vehicleInfo = await this.vehicleInfoRepository.findVehicleInfoByUserId(user.id);

      // 유저 토큰 생성 (Secret + Payload) 가 필요하다.
      const payload = { id: user.id, username, role: user.role, vehicleInfo: vehicleInfo || null}; // payload에는 중요한 정보를 넣어두면안됨 토큰을 사용해서 정보를 가져갈 수 있기때문에
      const accessToken = await this.jwtService.sign(payload);

      return { accessToken };
    } else {
      throw new UnauthorizedException('login failed');
    }
  }


}
