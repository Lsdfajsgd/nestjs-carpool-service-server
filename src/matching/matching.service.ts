import { Injectable, UnauthorizedException } from "@nestjs/common";
import { MatchingRequestDto } from './dto/matching-request.dto';
import { JwtService } from '@nestjs/jwt';
import { VehicleInfo } from "../auth/entities/vehicle-info.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { RideRequestsEntity } from "./entities/ride-requests.entity";
import { RideRequestsRepository } from "./repositories/ride-requests.repository";
import { RidePassengersRepository } from "./repositories/ride-passengers.repository";
import { UsersRepository } from "../auth/repositories/users.repository";
import { RidePassengersEntity } from "./entities/ride-passengers.entity";

@Injectable()
export class MatchingService {

  private driverQueues: Map<string, MatchingRequestDto[]> = new Map(); // 출발지-목적지별 운전자 큐
  private passengerQueues: Map<string, MatchingRequestDto[]> = new Map(); // 출발지-목적지별 탑승자 큐
  private matchingRooms: Map<string, { driver: MatchingRequestDto; passengers: MatchingRequestDto[] }> = new Map(); // 매칭된 그룹
  private isProcessing: Map<string, boolean> = new Map(); // 각 큐별 처리 상태 관리
  private cancellations: Map<string, boolean> = new Map(); // 각 매칭 프로세스 별로 매칭 중단 여부 확인 관리

  constructor(
    @InjectRepository(RideRequestsRepository)
    private rideRequestsRepository: RideRequestsRepository,
    @InjectRepository(RidePassengersRepository)
    private ridePassengersRepository: RidePassengersRepository,
    @InjectRepository(UsersRepository)
    private userRepository: UsersRepository,
    private readonly jwtService: JwtService
  ) {}


  // 매칭 요청을 리스트나 큐에 저장하는 메서드
  async addMatchRequest(request: MatchingRequestDto, token: string): Promise<void> {
    // JWT 토큰에서 사용자 역할(role)을 추출
    const decodedToken = this.jwtService.decode(token) as { id: number, username: string; role: string; vehicleInfo: VehicleInfo };

    if (!decodedToken) {
      throw new UnauthorizedException('Invalid token');
    }


    // username 없애기
    const { username: jwtUsername, role, } = decodedToken;
    const { username } = request;

    console.log(request.departureTime);

    if (username !== jwtUsername) {
      throw new UnauthorizedException('Invalid username: Username in the request does not match the token');
    }

    const key = `${request.origin}-${request.destination}`; // 큐를 구분하는 키

    if (role === "driver") {
      // 운전자 요청 처리
      request.seatingCapacity = decodedToken.vehicleInfo?.seatingCapacity || 0;

      if (!this.driverQueues.has(key)) {
        this.driverQueues.set(key, []); // 새 큐 생성
        console.log(`새로운 큐 생성 ${key}`);
      }

      const queue = this.driverQueues.get(key)!;
      if (!queue.some((driver) => driver.username === username)) {
        queue.push(request); // 운전자를 큐에 추가
        console.log(`운전자 ${username}이 ${key} 큐에 추가되었습니다.`);

      } else {
        console.log(`운전자 ${username}의 요청이 이미 존재합니다.`);
      }
    } else if (role === "passenger") {
      // 탑승자 요청 처리
      if (!this.passengerQueues.has(key)) {
        this.passengerQueues.set(key, []); // 새 큐 생성
      }
      const queue = this.passengerQueues.get(key)!;
      if (!queue.some((passenger) => passenger.username === username)) {
        queue.push(request); // 탑승자를 큐에 추가
        console.log(`탑승자 ${username}이 ${key} 큐에 추가되었습니다.`);

      } else {
        console.log(`탑승자 ${username}의 요청이 이미 존재합니다.`);
      }
    }

    this.logQueues();
    this.logMatchingRoomsSummary();
    this.startMatchingProcess(key); // 매칭 프로세스 실행
  }


  // 데이터 베이스 생성 로직
  private async saveMatchToDatabase(driver: MatchingRequestDto, passengers: MatchingRequestDto[]): Promise<void> {
    const driverEntity = await this.userRepository.findOne({
      where: { username: driver.username },
    });

    if (!driverEntity) {
      throw new Error(`Driver with username ${driver.username} not found.`);
    }

    // 탑승자 엔티티 찾기
    const passengerEntities = await Promise.all(
      passengers.map(async (passenger) => {
        const passengerEntity = await this.userRepository.findOne({
          where: { username: passenger.username },
        });

        if (!passengerEntity) {
          throw new Error(`Passenger with username ${passenger.username} not found.`);
        }

        return passengerEntity;
      }),
    );

    // 1. 운전자 요청 저장
    const savedRideRequest = await this.rideRequestsRepository.saveRideRequest(driverEntity, driver);

    // 2. 탑승자 요청 저장
    await this.ridePassengersRepository.savePassengersForRideRequest(savedRideRequest, passengerEntities);

    console.log('매칭 데이터를 데이터베이스에 성공적으로 저장했습니다.');
  }

  /**
   * 특정 큐의 매칭 프로세스를 시작
   */
  private async startMatchingProcess(key: string) {
    if (this.isProcessing.get(key)) return; // 이미 처리 중인 경우 중복 실행 방지
    this.isProcessing.set(key, true);

    while (true) {
      const driverQueue = this.driverQueues.get(key) || [];
      const passengerQueue = this.passengerQueues.get(key) || [];

      // 큐가 비어 있으면 대기
      if (driverQueue.length === 0 || passengerQueue.length === 0) {
        console.log(`${key} 큐가 비어 있습니다. 대기 중...`);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초 대기
        continue;
      }

      const driverRequest = driverQueue.shift()!;
      //const driverRequest = this.getDriverRequest(driverUsername, key, );

      console.log(driverRequest.departureTime);

      if (!driverRequest) continue;

      const result = await this.handleTimeout(driverRequest, passengerQueue, key);

      if (result.success) {
        // 매칭 성공 시 매칭룸에 추가
        this.matchingRooms.set(driverRequest.username, {
          driver: driverRequest,
          passengers: result.matchedPassengers,
        });

        await this.saveMatchToDatabase(driverRequest, result.matchedPassengers);

        console.log(`매칭룸 생성: 운전자 ${driverRequest.username}`, {
          driver: driverRequest,
          passengers: result.matchedPassengers,
        });

      } else {
        console.log(`운전자 ${driverRequest.username}의 매칭이 실패했습니다.`);
        driverQueue.push(driverRequest); // 다시 큐에 추가
      }

      this.logMatchingRoomsSummary();

      if (driverQueue.length === 0 && passengerQueue.length === 0) break; // 모두 처리된 경우 종료
    }

    this.isProcessing.set(key, false); // 처리 완료 상태로 변경
  }


  /**
   * 타임아웃 처리: 3분 동안 대기하며 매칭 시도
   */
  private async handleTimeout(
    driverRequest: MatchingRequestDto,
    passengerQueue: MatchingRequestDto[],
    key: string
  ): Promise<{ success: boolean; matchedPassengers: MatchingRequestDto[] }> {
    const { origin, destination, departureTime, seatingCapacity } = driverRequest;
    const matchedPassengers: MatchingRequestDto[] = [];
    let isCancelled = false; // 취소 여부 플래그

    return new Promise((resolve) => {
      //const timer = setTimeout(() => resolve({ success: false, matchedPassengers }), 3 * 60 * 1000); // 3분 타임아웃

      const checkInterval = setInterval(() => {
        if (this.cancellations.get(key)) {
          // 취소 요청이 발생한 경우
          const cancelledRole = this.getCancelledRole(key, driverRequest.username);

          if (cancelledRole === "driver") {
            // 운전자 취소: 프로세스 중단 및 매칭 실패 처리
            console.log(`운전자 ${driverRequest.username} 매칭 취소 요청.`);
            clearInterval(checkInterval);
            resolve({ success: false, matchedPassengers });
            return;
          } else if (cancelledRole === "passenger") {
            // 탑승자 취소: 프로세스 일시 중지 후 재개
            console.log(`${key}의 매칭 프로세스가 탑승자 취소 요청으로 일시 중지됩니다.`);
            clearInterval(checkInterval);
            this.resumeProcessAfterPassengerCancellation(key, resolve, matchedPassengers);
            return;
          }
        }

        console.log(`${driverRequest.username} 매칭중입니다...`)
        for (let i = 0; i < passengerQueue.length; i++) {
          const passengerRequest = passengerQueue[i];
          // console.log(`매칭 핸들러 입니다.현재는 매칭을 위해 순회중입니다. ${i}번째 탑승자 입니다 -> ${passengerRequest.username}`);

          // console.log(`매칭 핸들러 입니다. 매칭 출발지 비교하겠습니다 -> ${passengerRequest.username}의 ${passengerRequest.origin} 과 ${origin}`);
          // console.log(`매칭 핸들러 입니다. 매칭 목적지 비교하겠습니다 -> ${passengerRequest.username}의 ${passengerRequest.destination} 과 ${destination}`);
          // console.log(`매칭 핸들러 입니다. 매칭 시간 비교하겠습니다 -> ${passengerRequest.username}의 ${passengerRequest.departureTime} 과 ${departureTime}`);
          // console.log(`시간 비교 결과 ${this.isWithinTimeRange(passengerRequest.departureTime, departureTime)}`);

          // const passengerName = passengerRequest.username;
          // const passengerId = this.getPassengerId(passengerName);

          if (
            passengerRequest.origin === origin &&
            passengerRequest.destination === destination &&
            this.isWithinTimeRange(passengerRequest.departureTime, departureTime)
          ) {
            matchedPassengers.push(passengerRequest);
            passengerQueue.splice(i, 1); // 큐에서 제거

            // console.log(`매칭 핸들러 입니다. 매칭 조건이 부합했습니다. 부합한 탑승자 입니다 -> ${passengerRequest.username}`);

            // *** 매칭된 탑승자 정보를 RidePassengersEntity 테이블에 저장 ***
            // this.ridePassengersRepository.savePassengerRequest(passengerId, driverId);
            // console.log(`탑승자 ${passengerRequest.username}이 운전자 ${driverRequest.username}와 매칭되었습니다.`);

            if (matchedPassengers.length >= seatingCapacity-1) {
              clearInterval(checkInterval);
              //clearTimeout(timer);
              resolve({ success: true, matchedPassengers });

              // console.log(`매칭 핸들러 입니다. 매칭이 모두 완료했습니다 매칭된 탑승자 입니다-> ${matchedPassengers}`);

              return;
            }
          }
        }
      }, 5000); // 5초마다 확인
    });
  }

  /**
   * 취소 요청의 역할 확인
   * @param key 매칭 키
   * @param driverUsername 운전자 이름
   * @returns 'driver' | 'passenger'
   */
  private getCancelledRole(key: string, driverUsername: string): "driver" | "passenger" {
    const driverQueue = this.driverQueues.get(key) || [];
    const isDriverInQueue = driverQueue.some((driver) => driver.username === driverUsername);

    // 운전자가 큐에 없는 경우, 매칭 프로세스 중인 운전자
    if (!isDriverInQueue) {
      return "driver";
    }
    return "passenger";
  }

  /**
   * 탑승자 취소 요청으로 인한 프로세스 재개
   */
  private resumeProcessAfterPassengerCancellation(
    key: string,
    resolve: (value: { success: boolean; matchedPassengers: MatchingRequestDto[] }) => void,
    matchedPassengers: MatchingRequestDto[]
  ) {
    setTimeout(() => {
      this.cancellations.set(key, false); // 취소 상태 초기화
      console.log(`${key} 큐의 매칭 프로세스가 재개됩니다.`);
      resolve({ success: false, matchedPassengers }); // 프로세스 재개
    }, 1000); // 1초 대기 후 재개
  }


  async cancelMatching(key: string, token: string): Promise<void> {
    const decodedToken = this.jwtService.decode(token) as { username: string; role: string };
    const username = decodedToken.username;

    // 매칭 프로세스가 활성화된 상태인지 확인
    if (!this.isProcessing.get(key)) {
      console.log(`${key}에 활성화된 매칭 프로세스가 없습니다.`);
      return;
    }

    // 운전자인 경우
    if (decodedToken.role === "driver") {
      const driverQueue = this.driverQueues.get(key) || [];

      // 1. 운전자가 큐에 있는지 확인
      const driverExistsInQueue = driverQueue.some((driver) => driver.username === username);

      if (driverExistsInQueue) {
        // 큐에서 운전자 제거
        this.driverQueues.set(
          key,
          driverQueue.filter((driver) => driver.username !== username)
        );
        console.log(`${username}이 ${key} 큐에서 제거되었습니다.`);
      } else {
        // 2. 운전자가 큐에 없고 매칭 프로세스가 활성화된 경우
        const isProcessingForDriver = this.isProcessing.get(key) && !this.matchingRooms.has(username);
        if (isProcessingForDriver) {
          console.log(`${username}은 현재 매칭 프로세스에서 처리 중입니다. 매칭을 중단합니다.`);

          // 매칭 프로세스에서 resolve 호출
          this.cancellations.set(key, true);
          console.log(`프로세스 중단: ${key}에서 운전자 ${username}의 매칭 취소.`);
          return;
        }

        console.log(`${username}은 매칭 큐에도 없고, 매칭 프로세스 중도 아닙니다.`);
      }
    }

    // 탑승자인 경우
    if (decodedToken.role === "passenger") {
      const passengerQueue = this.passengerQueues.get(key) || [];
      const passengerExistsInQueue = passengerQueue.some((passenger) => passenger.username === username);

      if (passengerExistsInQueue) {
        // 큐에서 탑승자 제거
        this.passengerQueues.set(
          key,
          passengerQueue.filter((passenger) => passenger.username !== username)
        );
        console.log(`${username}이 ${key} 큐에서 제거되었습니다.`);
      } else {
        console.log(`${username}은 매칭 큐에 존재하지 않습니다.`);
      }
    }

    this.cancellations.set(key, false); // 플래그 초기화
  }


  // async getPassengerId (passengerName : string): Promise<number> {
  //   const passenger = await this.userRepository.findOne({where: { username :passengerName }});
  //   return passenger.id;
  // }

  /**
   * 시간 범위 비교
   */
  private isWithinTimeRange(time1: string, time2: string): boolean {
    const time1Date = new Date(time1);
    const time2Date = new Date(time2);
    const diff = Math.abs(time1Date.getTime() - time2Date.getTime());
    return diff <= 5 * 60 * 1000; // 5분 이내
  }


  /**
   * 큐 상태 출력
   */
  private logQueues(): void {
    console.log("=== 큐 상태 ===");

    // 운전자 큐 출력
    console.log("운전자 큐:");
    if (this.driverQueues.size === 0) {
      console.log("운전자 큐가 비어 있습니다.");
    } else {
      this.driverQueues.forEach((queue, key) => {
        const driverNames = queue.map((driver) => driver.username);
        console.log(`출발지-목적지: ${key}`);
        console.log(`대기 중인 운전자: ${driverNames.join(", ") || "없음"}`);
      });
    }

    console.log("----------------------");

    // 탑승자 큐 출력
    console.log("탑승자 큐:");
    if (this.passengerQueues.size === 0) {
      console.log("탑승자 큐가 비어 있습니다.");
    } else {
      this.passengerQueues.forEach((queue, key) => {
        const passengerNames = queue.map((passenger) => passenger.username);
        console.log(`출발지-목적지: ${key}`);
        console.log(`대기 중인 탑승자: ${passengerNames.join(", ") || "없음"}`);
      });
    }

    console.log("=== 큐 상태 출력 완료 ===");
  }


  // 매칭룸 상태 출력 메서드
  private logMatchingRoomsSummary(): void {
    console.log("=== 매칭된 그룹 상태 ===");

    if (this.matchingRooms.size === 0) {
      console.log("매칭된 그룹이 없습니다.");
      return;
    }

    this.matchingRooms.forEach((room, driverUsername) => {
      const passengerNames = room.passengers.map((passenger) => passenger.username);
      console.log(`운전자: ${driverUsername}`);
      console.log(`탑승자: ${passengerNames.join(", ") || "없음"}`);
      console.log("----------------------");
    });

    console.log("=== 매칭된 그룹 상태 출력 완료 ===");
  }

}
