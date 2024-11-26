<<<<<<< HEAD
import { Body, Controller, Get, Post, Req, UseGuards, ValidationPipe } from "@nestjs/common";
import {AuthService} from "./auth.service";
import {AuthCredentialDto} from "./dto/auth-credential.dto";
import {AuthGuard} from "@nestjs/passport";
import { AuthLoginDto } from "./dto/auth-login.dto";
import { GetUser } from './get-user.decorator';
import { Users } from "./entities/users.entity";
=======
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthLoginDto } from './dto/auth-login.dto';
import { GetUser } from './get-user.decorator';
import { User } from './entities/user.entity';
>>>>>>> devlop

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 회원가입 요청
  @Post('/signup')
  signUp(
    @Body(ValidationPipe) authCredentialDto: AuthCredentialDto,
  ): Promise<void> {
    return this.authService.signUp(authCredentialDto);
  }

  // 로그인 요청
  @Post('/signin')
  signIn(
    @Body(ValidationPipe) authLoginDto: AuthLoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.signIn(authLoginDto);
  }

  // 사용자 정보 토큰에서 가져오기 테스트
  @Post('/test')
  @UseGuards(AuthGuard())
  test(@Req() req) {
    console.log('req', req);
  }

  @Get('/refresh')
  @UseGuards(AuthGuard())
<<<<<<< HEAD
  refresh(@GetUser() user: Users) {
=======
  refresh(@GetUser() user: User) {
>>>>>>> devlop
    return this.authService.refreshToken(user);
  }

  @Get('/me')
  @UseGuards(AuthGuard())
  getProfile(@Req() req: any) {
    console.log('Authorization Header:', req.headers.authorization);
<<<<<<< HEAD
    const user: Users = req.user; // JwtStrategy에서 리턴한 User 객체를 가져옴
=======
    const user: User = req.user; // JwtStrategy에서 리턴한 User 객체를 가져옴
>>>>>>> devlop
    return this.authService.getProfile(user);
  }

  @Post('/logout')
  @UseGuards(AuthGuard())
<<<<<<< HEAD
  logout(@GetUser() user: Users) {
    console.log('Logout Authorization Header:', user);
    return this.authService.deleteRefreshToken(user);
  }

=======
  logout(@GetUser() user: User) {
    console.log('Logout Authorization Header:', user);
    return this.authService.deleteRefreshToken(user);
  }
>>>>>>> devlop
}