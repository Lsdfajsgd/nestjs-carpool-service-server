import {Body, Controller, Post, Req, UseGuards, ValidationPipe} from '@nestjs/common';
import {AuthService} from "./auth.service";
import {AuthCredentialDto} from "./dto/auth-credential.dto";
import {AuthGuard} from "@nestjs/passport";
import { AuthLoginDto } from "./dto/auth-login.dto";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 회원가입 요청
  @Post('/signup')
  signUp(@Body(ValidationPipe) authCredentialDto : AuthCredentialDto) : Promise<void> {
    return this.authService.signUp(authCredentialDto);
  }

  // 로그인 요청
  @Post('/signin')
  signIn(@Body(ValidationPipe) authLoginDto : AuthLoginDto) : Promise<{accessToken: string}> {
    return this.authService.signIn(authLoginDto);
  }

  // 사용자 정보 토큰에서 가져오기 테스트
  @Post('/test')
  @UseGuards(AuthGuard())
  test(@Req() req){
      console.log('req', req);
  }

}