import { Body, Controller, Get, Post } from "@nestjs/common";
import { MailService } from './mail.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // 인증 코드 전송
  @Post('/send-code')
  async sendVerificationCode(@Body() body: { email: string }): Promise<string> {
    const { email } = body;
    return await this.mailService.sendVerificationCode(email);
  }

  //인증 요청
  @Post('verify-code')
  async verifyCode(@Body() body: { email: string; code: string }): Promise<boolean> {
    const { email, code } = body;
    return await this.mailService.verifyCode(email, code);
    // if (this.mailService.verifyCode(email, code)) {
    //   return '인증 성공';
    // } else {
    //   return '인증 실패';
    // }
  }

}