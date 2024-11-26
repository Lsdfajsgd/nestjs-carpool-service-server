import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './repositories/user.repository';
import { VehicleRepository } from './repositories/vehicle.repository';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AuthLoginDto } from './dto/auth-login.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import * as stream from 'node:stream';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private vehicleRepository: VehicleRepository,
    // jwt 서비스 등록
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // 회원가입
  async signUp(authCredentialDto: AuthCredentialDto): Promise<void> {
    return this.userRepository.createUser(authCredentialDto);
  }

  // 로그인
  async signIn(
    authLoginDto: AuthLoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { name, password } = authLoginDto;
    const user = await this.validateToken(name, password);
    const tokens = await this.getTokens({ id: user.id });
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshToken(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { id: user.id };
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

  async getProfile(user: User): Promise<{
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
        ? await this.vehicleRepository.findVehicleByUserId(user.id)
        : null;

    return {
      name: userWithProfile.name,
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

  private async getTokens(payload: { id: number }) {
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

  private async validateToken(name: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { name } });
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

  async deleteRefreshToken(user: User) {
    try {
      console.log("user ", user.refreshToken);
      await this.userRepository.update(user.id, { refreshToken: null });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}