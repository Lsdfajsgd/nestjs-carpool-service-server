import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingRequestDto } from './dto/matching-request.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('/request')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
  async requestMatch(@Body() matchRequestDto: MatchingRequestDto, @Req() req) {
    const token = req.headers.authorization.split(' ')[1]; // 요청에서 토큰 추출
    await this.matchingService.addMatchRequest(matchRequestDto, token);

    return { message: '매칭 요청이 성공적으로 처리되었습니다.' };
  }

  @Post('/cancel')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
  async cancelMatch(@Body("key")key: string, @Req() req) {
    const token = req.headers.authorization.split(' ')[1]; // 요청에서 토큰 추출
    await this.matchingService.cancelMatching(key, token); // 서비스의 취소 로직 호출
    return { message: `${key} 큐에서 매칭이 취소되었습니다.` };
  }
}
