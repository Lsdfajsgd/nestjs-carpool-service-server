// src/mail/mail.service.ts
import { BadRequestException, ConflictException, GoneException, Injectable } from "@nestjs/common";
import { MailerService } from '@nestjs-modules/mailer';
import { UsersRepository } from '../auth/repositories/users.repository';

@Injectable()
export class MailService {
  private verificationCodes: Record<string, { code: string; expiresAt: number }> = {};

  constructor(
    private readonly mailerService: MailerService,
    private userRepository: UsersRepository,
  ) {}

  // 인증코드 생성 및 저장
  async sendVerificationCode(email: string): Promise<string> {

    // email 유니크 체크
    const verificationEmail = await this.userRepository.findOne({
      where: { email: email },
    });
    if (verificationEmail){
      throw new ConflictException('이메일이 이미 존재합니다.'); // 409 Error
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 300; // 3분 후 만료

    // 메모리 내에 코드 저장
    this.verificationCodes[email] = { code, expiresAt };

    // 코드 이메일 전송 로직
    await this.mailerService.sendMail({
      to: email,
      subject: '가입 인증 메일',
      html: `<h1>인증 코드를 입력하면 가입 인증이 완료됩니다.</h1><br/>${code}`,
    });

    return code;
  }

  async verifyCode(email: string, inputCode: string): Promise<boolean> {
    const storedCodeData = this.verificationCodes[email];
    if (storedCodeData) {
      const { code, expiresAt } = storedCodeData;

      if (Date.now() > expiresAt) {
        delete this.verificationCodes[email]; // 만료된 코드 삭제
        throw new GoneException('인증 코드가 만료되었습니다.');
      }

      if (code === inputCode) {
        delete this.verificationCodes[email]; // 인증 완료 후 삭제
        return true; // 인증 성공
      } else {
        // 잘못된 인증 코드에 대해 예외 처리 추가
        throw new BadRequestException('잘못된 인증 코드입니다.');
      }
    }
    throw new BadRequestException('잘못된 인증 요청입니다.');
  }

}