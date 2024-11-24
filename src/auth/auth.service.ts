import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {UsersRepository} from "./repositories/users.repository";
import {AuthCredentialDto} from "./dto/auth-credential.dto";
import * as bcrypt from 'bcryptjs';
import {JwtService} from "@nestjs/jwt";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { VehicleInfoRepository } from "./repositories/vehicle-info.repository";
import { Users } from "./entities/users.entity";
import { ConfigService } from '@nestjs/config';
import { VehicleInfo } from "./entities/vehicle-info.entity";

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
  // async signIn(authLoginDto: AuthLoginDto): Promise<{accessToken: string}> {
  //   const { username, password } = authLoginDto;
  //   // username으로 fineOne()을 사용해서 해당 유저가 존재하는지 확인후 결과값 user에 저장
  //   const user = await this.userRepository.findOne({ where: { username }})
  //
  //   // 해쉬된 비밀번호를 비교하기 위해서 bcrypt의 compare() 메소드사용
  //   if (user && (await bcrypt.compare(password, user.password))) {
  //     // 차량 정보 가져오기
  //     const vehicleInfo = await this.vehicleInfoRepository.findVehicleInfoByUserId(user.id);
  //
  //     // 유저 토큰 생성 (Secret + Payload) 가 필요하다.
  //     const payload = { id: user.id, username, role: user.role, vehicleInfo: vehicleInfo || null}; // payload에는 중요한 정보를 넣어두면안됨 토큰을 사용해서 정보를 가져갈 수 있기때문에
  //     const accessToken = await this.jwtService.sign(payload);
  //
  //     return { accessToken };
  //   } else {
  //     throw new UnauthorizedException('login failed');
  //   }
  // }

  // 로그인
  async signIn(
    authLoginDto: AuthLoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { username, password } = authLoginDto;
    const user = await this.validateToken(username, password);
    const tokens = await this.getTokens({ id: user.id});
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshToken(
    user: Users,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { id: user.id};
    const accessTokenExpiresIn = parseInt(
      this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
      10,
    );
    const refreshTokenExpiresIn = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
      10,
    );
    // 새로운 액세스 토큰과 리프레시 토큰 생성
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn,
    });

    // 필요한 경우 데이터베이스에 리프레시 토큰을 저장하여 유효성을 관리할 수 있습니다.
    return { accessToken, refreshToken };
  }

  async getProfile(user: Users): Promise<{
    name: string;
    email: string;
    phoneNumber: string;
    role: string;
    profile: { profilePicture: string; bio: string };
    vehicleInfo?: {
      model: string;
      licensePlate: string;
      seatingCapacity: number;
    } | null;
  }> {
    const userWithProfile = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['profile'],
    });

    if (!userWithProfile) {
      throw new BadRequestException('User profile not found');
    }
    const vehicleInfo =
      userWithProfile.role === 'driver'
        ? await this.vehicleInfoRepository.findVehicleInfoByUserId(user.id)
        : null;

    return {
      name: userWithProfile.username,
      email: userWithProfile.email,
      phoneNumber: userWithProfile.phoneNumber,
      role: userWithProfile.role,
      profile: {
        profilePicture: userWithProfile.profile?.profilePicture || '',
        bio: userWithProfile.profile?.bio || '',
      },
      vehicleInfo: vehicleInfo
        ? {
          model: vehicleInfo.vehicleModel,
          licensePlate: vehicleInfo.licensePlate,
          seatingCapacity: vehicleInfo.seatingCapacity,
        }
        : null,
    };
  }

  private async getTokens(payload: { id: number}) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret)
      throw new InternalServerErrorException(
        'JWT_SECRET이 정의되지 않았습니다.',
      );
    const accessTokenExpiresIn = parseInt(
      this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
      10,
    );
    const refreshTokenExpiresIn = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
      10,
    );
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret, // ConfigService를 통해 secret 가져오기
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtSecret, // ConfigService를 통해 secret 가져오기
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async validateToken(username: string, password: string): Promise<Users> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 일치하지 않습니다.',
      );
    }
    return user;
  }

  private async saveRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    try {
      await this.userRepository.update(userId, { refreshToken });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteRefreshToken(user: Users) {
    try {
      console.log("user ", user.refreshToken);
      await this.userRepository.update(user.id, { refreshToken: null });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }


}
