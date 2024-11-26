import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingRequestDto } from './dto/matching-request.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('matching')
export class MatchingController {
<<<<<<< HEAD
  constructor(private readonly matchingService: MatchingService) {}

  // 매칭 요청
  @Post('/request')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
  async requestMatch(@Body() matchRequestDto: MatchingRequestDto, @Req() req) {
    const user = req.user;
    console.log(user.username);
    await this.matchingService.addMatchRequest(matchRequestDto, user);

    return { message: '매칭 요청이 성공적으로 처리되었습니다.' };
  }

  // 매칭 취소
  @Post('/cancel')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
  async cancelMatch(@Body("key")key: string, @Req() req) {
    const user = req.user;
    await this.matchingService.cancelMatching(key, user); // 서비스의 취소 로직 호출
    return { message: `${key} 큐에서 매칭이 취소되었습니다.` };
  }

  // 매칭 상태 확인 요청
  @Post('/status')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
  async getMatchingStatus(@Body('key') key: string, @Req() req) {
    const user = req.user;
    const status = await this.matchingService.getMatchingStatus(user, key);
    return { status }; // 정수 값 반환
  }


  // 방 나가기
  @Post('/leave')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
  async leaveMatch(@Body('rideRequestId') rideRequestId: number, @Req() req) {
    const user = req.user;
    await this.matchingService.leaveMatch(user, rideRequestId);
    return { message: '매칭그룹에서 성공적으로 나갔습니다.' };
  }

  // 운행동의(시작)
  @Post('/agree')
  @UseGuards(AuthGuard('jwt'))
  async agreeToStartRide(@Body('rideRequestId') rideRequestId: number, @Req() req) {
    const user = req.user;
    await this.matchingService.agreeToStartRide(user, rideRequestId);
    return { message: '운행 동의가 처리되었습니다.' };
  }

  // 운행완료
  @Post('/complete')
  @UseGuards(AuthGuard('jwt'))
  async completeRide(@Body('rideRequestId') rideRequestId: number, @Req() req) {
    const user = req.user;
    await this.matchingService.completeRide(user, rideRequestId);
    return { message: '운행이 완료되었습니다.' };
  }

  // 강퇴
  @Post('/kick')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
  async kickPassenger(@Body('passengerId') passengerId: number, @Req() req) {
    const driver = req.user;
    await this.matchingService.kickPassenger(driver, passengerId);
    return { message: `탑승자 ID ${passengerId}를 강퇴하였습니다.` };
  }

}
=======
    constructor(private readonly matchingService: MatchingService) { }

    // 매칭 요청
    @Post('/request')
    @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
    async requestMatch(@Body() matchRequestDto: MatchingRequestDto, @Req() req) {
        const user = req.user;
        console.log(user.username);
        await this.matchingService.addMatchRequest(matchRequestDto, user);

        return { message: '매칭 요청이 성공적으로 처리되었습니다.' };
    }

    // 매칭 취소
    @Post('/cancel')
    @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
    async cancelMatch(@Body("key") key: string, @Req() req) {
        const user = req.user;
        await this.matchingService.cancelMatching(key, user); // 서비스의 취소 로직 호출
        return { message: `${key} 큐에서 매칭이 취소되었습니다.` };
    }

    // 매칭 상태 확인 요청
    @Post('/status')
    @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
    async getMatchingStatus(@Body('key') key: string, @Req() req) {
        const user = req.user;
        const status = await this.matchingService.getMatchingStatus(user, key);
        return { status }; // 정수 값 반환
    }


    // 방 나가기
    @Post('/leave')
    @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
    async leaveMatch(@Body('rideRequestId') rideRequestId: number, @Req() req) {
        const user = req.user;
        await this.matchingService.leaveMatch(user, rideRequestId);
        return { message: '매칭그룹에서 성공적으로 나갔습니다.' };
    }

    // 강퇴
    @Post('/kick')
    @UseGuards(AuthGuard('jwt')) // JWT 인증 적용
    async kickPassenger(@Body('passengerId') passengerId: number, @Req() req) {
        const driver = req.user;
        await this.matchingService.kickPassenger(driver, passengerId);
        return { message: `탑승자 ID ${passengerId}를 강퇴하였습니다.` };
    }

}
>>>>>>> devlop
