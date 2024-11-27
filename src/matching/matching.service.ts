import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { MatchingRequestDto } from './dto/matching-request.dto';
import { JwtService } from '@nestjs/jwt';
import { VehicleInfo } from "../auth/entities/vehicle-info.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { RideRequestsEntity } from "./entities/ride-requests.entity";
import { RideRequestsRepository } from "./repositories/ride-requests.repository";
import { RidePassengersRepository } from "./repositories/ride-passengers.repository";
import { UsersRepository } from "../auth/repositories/users.repository";
import { RidePassengersEntity } from "./entities/ride-passengers.entity";
import { Users } from "../auth/entities/users.entity";
import { VehicleInfoRepository } from "../auth/repositories/vehicle-info.repository";
import { MatchingStatus } from "./matching-status.enum";
import { TripsRepository } from "./repositories/trips.repository";

@Injectable()
export class MatchingService {

  private driverQueues: Map<string, MatchingRequestDto[]> = new Map(); // 출발지-목적지별 운전자 큐
  private passengerQueues: Map<string, MatchingRequestDto[]> = new Map(); // 출발지-목적지별 탑승자 큐
  private matchingRooms: Map<string, { driver: MatchingRequestDto; passengers: MatchingRequestDto[]; rideRequestId: number; }> = new Map(); // 매칭된 그룹
  private isProcessing: Map<string, boolean> = new Map(); // 각 큐별 처리 상태 관리
  private cancellations: Map<string, boolean> = new Map(); // 각 매칭 프로세스 별로 매칭 중단 여부 확인 관리
  private temporarilyMatchedPassengers: Set<string> = new Set(); // 임시로 매칭된 탑승자들의 username을 저장
  private processingDrivers: Set<string> = new Set(); // 매칭 프로세스 중인 운전자

  private activeUsers: Set<string> = new Set(); // 현재 매칭 요청 중인 사용자들 -> 중복매칭요청방지를 위한 메모리.. 사용할 수밖에 없음..

  constructor(
    @InjectRepository(RideRequestsRepository)
    private rideRequestsRepository: RideRequestsRepository,
    @InjectRepository(RidePassengersRepository)
    private ridePassengersRepository: RidePassengersRepository,
    @InjectRepository(UsersRepository)
    private userRepository: UsersRepository,
    @InjectRepository(VehicleInfoRepository)
    private vehicleInfoRepository: VehicleInfoRepository,
    @InjectRepository(TripsRepository)
    private tripsRepository: TripsRepository,
    private readonly jwtService: JwtService
  ) {}


  // 매칭 요청을 리스트나 큐에 저장하는 메서드
  async addMatchRequest(request: MatchingRequestDto, user: Users): Promise<void> {
    const { username, role } = user;

    // **전역 Set에서 사용자 존재 여부 확인**
    if (this.activeUsers.has(username)) {
      throw new ConflictException('이미 매칭 요청 중입니다.');
    }

    // **사용자를 전역 Set에 추가**
    this.activeUsers.add(username);

    request.username = username;

    const key = `${request.startPoint}-${request.endPoint}`; // 큐를 구분하는 키
    const cancellationKey = `${key}-${username}`;
    this.cancellations.delete(cancellationKey); // 요청한 사용자의 이전 취소 플래그 삭제(초기화)

    if (role === "driver") {
      // 운전자 요청 처리
      const vehicleInfo = await this.vehicleInfoRepository.findOne({
        where: { userId: user.id },
      });
      // request.seatingCapacity = decodedToken.vehicleInfo?.seatingCapacity || 0;
      request.seatingCapacity = vehicleInfo?.seatingCapacity || 0;
      //request.seatingCapacity = user.vehicleInfo.seatingCapacity;

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
  private async saveMatchToDatabase(driver: MatchingRequestDto, passengers: MatchingRequestDto[]): Promise<number> {
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

    // 생성된 rideRequestId 반환
    return savedRideRequest.id;
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

      if (driverQueue.length === 0) {
        console.log("운전자 큐가 비어 있습니다.");
      } else {
        driverQueue.forEach((driver) => {
          const driverNames = driverQueue.map((driver) => driver.username);
          console.log(`출발지-목적지: ${key}`);
          console.log(`대기 중인 운전자: ${driverNames.join(", ") || "없음"}`);
        });
      }

      // 큐가 비어 있으면 대기
      if (driverQueue.length === 0 || passengerQueue.length === 0) {
        console.log(`${key} 큐가 비어 있습니다. 대기 중...`);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5초 대기
        continue;
      }

      const driverRequest = driverQueue.shift()!;
      //const driverRequest = this.getDriverRequest(driverUsername, key, );

      console.log(driverRequest.endPoint);

      if (!driverRequest) continue;

      // **운전자를 processingDrivers에 추가**
      this.processingDrivers.add(driverRequest.username);

      const result = await this.handleTimeout(driverRequest, passengerQueue, key);

      // **매칭 프로세스가 완료되면 운전자를 processingDrivers에서 제거**
      this.processingDrivers.delete(driverRequest.username);

      if (result.success) {
        // 매칭 성공 시 매칭룸에 추가
        // this.matchingRooms.set(driverRequest.username, {
        //   driver: driverRequest,
        //   passengers: result.matchedPassengers,
        // });

        const rideRequestId = await this.saveMatchToDatabase(driverRequest, result.matchedPassengers);

        this.matchingRooms.set(driverRequest.username, {
          driver: driverRequest,
          passengers: result.matchedPassengers,
          rideRequestId, // rideRequestId 저장
        });

        console.log(`매칭룸 생성: 운전자 ${driverRequest.username}`, {
          driver: driverRequest,
          passengers: result.matchedPassengers,
        });

        // **탑승자들도 전역 Set에서 제거**
        result.matchedPassengers.forEach((passenger) => {
          this.activeUsers.delete(passenger.username);
        });

      } else {
        console.log(`운전자 ${driverRequest.username}의 매칭취소로 다음 큐 진행을 하겠습니다.`);
        // **매칭 프로세스가 완료되면 운전자를 전역 Set에서 제거**
        this.activeUsers.delete(driverRequest.username);
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
    const { startPoint, endPoint, requestTime, seatingCapacity } = driverRequest;
    const matchedPassengers: MatchingRequestDto[] = [];

    const { username: driverUsername } = driverRequest;
    const driverCancellationKey = `${key}-${driverUsername}`;

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {

        // 운전자 취소 여부 확인
        if (this.cancellations.get(driverCancellationKey)) {
          console.log(`운전자 ${driverUsername}의 매칭 취소 요청.`);
          clearInterval(checkInterval);
          this.cancellations.delete(driverCancellationKey); // 취소 플래그 삭제

          // 임시 매칭된 탑승자들 해제
          matchedPassengers.forEach((passenger) => {
            this.temporarilyMatchedPassengers.delete(passenger.username);
          });

          resolve({ success: false, matchedPassengers: [] });
          return;
        }

        const passengerQueue = this.passengerQueues.get(key) || [];

        // 탑승자 큐에서 취소한 탑승자 제거
        for (let i = passengerQueue.length - 1; i >= 0; i--) {
          const passenger = passengerQueue[i];
          const passengerCancellationKey = `${key}-${passenger.username}`;
          if (this.cancellations.get(passengerCancellationKey)) {
            console.log(`탑승자 ${passenger.username}의 매칭 취소 요청.`);
            this.cancellations.delete(passengerCancellationKey); // 취소 플래그 삭제
            this.temporarilyMatchedPassengers.delete(passenger.username);
            passengerQueue.splice(i, 1); // 큐에서 제거
          }
        }

        // 탑승자 큐에서 취소한 탑승자 제거
        // passengerQueue = passengerQueue.filter((passenger) => {
        //   const passengerCancellationKey = `${key}-${passenger.username}`;
        //   if (this.cancellations.get(passengerCancellationKey)) {
        //     console.log(`탑승자 ${passenger.username}의 매칭 취소 요청.`);
        //     this.cancellations.delete(passengerCancellationKey);  // 취소 플래그 삭제
        //     this.temporarilyMatchedPassengers.delete(passenger.username);
        //     return false; // 큐에서 제거
        //   }
        //   return true;
        // });


        console.log(`${driverRequest.username} 매칭중입니다...`)
        console.log(` ${key} : 대기 중인 탑승자 `)
        if (passengerQueue.length === 0) {
          console.log("탑승자 큐가 비어 있습니다.");
        } else {
          passengerQueue.forEach((driver) => {
            const passengerNames = passengerQueue.map((passenger) => passenger.username);
            console.log(`출발지-목적지: ${key}`);
            console.log(`대기 중인 탑승자: ${passengerNames.join(", ") || "없음"}`);
          });
        }

        for (let i = 0; i < passengerQueue.length; i++) {
          const passengerRequest = passengerQueue[i];
          const passengerUsername = passengerRequest.username;

          if (this.temporarilyMatchedPassengers.has(passengerUsername)) {
            continue;
          }

          if (
            passengerRequest.startPoint === startPoint &&
            passengerRequest.endPoint === endPoint//&&
            //this.isWithinTimeRange(passengerRequest.requestTime, requestTime)
          ) {
            matchedPassengers.push(passengerRequest);
            //passengerQueue.splice(i, 1); // 큐에서 제거
            this.temporarilyMatchedPassengers.add(passengerUsername);

            if (matchedPassengers.length >= seatingCapacity-1) {
              clearInterval(checkInterval);

              // 매칭 성공 시 탑승자를 큐에서 제거하고 임시 매칭 목록에서 제거
              matchedPassengers.forEach((matchedPassenger) => {
                const index = passengerQueue.findIndex(
                  (p) => p.username === matchedPassenger.username
                );
                if (index !== -1) {
                  passengerQueue.splice(index, 1);
                }
                this.temporarilyMatchedPassengers.delete(matchedPassenger.username);
              });


              resolve({ success: true, matchedPassengers });
              // console.log(`매칭 핸들러 입니다. 매칭이 모두 완료했습니다 매칭된 탑승자 입니다-> ${matchedPassengers}`);
              return;
            }
          }
        }
      }, 5000); // 5초마다 확인
    });
  }

  async cancelMatching(key: string, user: Users): Promise<void> {
    const username = user.username;
    const cancellationKey = `${key}-${username}`;

    // 매칭 프로세스가 활성화된 상태인지 확인
    if (!this.isProcessing.get(key)) {
      console.log(`${key}에 활성화된 매칭 프로세스가 없습니다.`);
      return;
    }

    // 운전자인 경우
    if (user.role === "driver") {
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

        // **매칭 프로세스에서 운전자 제거**
        if (this.processingDrivers.has(username)) {
          this.processingDrivers.delete(username);
          console.log(`매칭 프로세스에서 운전자 ${username}을 제거했습니다.`);
        }

        // 사실 없어도 될꺼같긴함.
        // 매칭 그룹에서 운전자 제거
        if (this.matchingRooms.has(username)) {
          this.matchingRooms.delete(username);
          console.log(`매칭 그룹에서 운전자 ${username}을 제거했습니다.`);
        }
      } else {
        // 2. 운전자가 큐에 없고 매칭 프로세스가 활성화된 경우
        const isProcessingForDriver = this.isProcessing.get(key) && !this.matchingRooms.has(username);
        if (isProcessingForDriver) {
          console.log(`${username}은 현재 매칭 프로세스에서 처리 중입니다. 매칭을 중단합니다.`);

          // 매칭 프로세스에서 resolve 호출
          this.cancellations.set(cancellationKey, true);
          console.log(`프로세스 중단: ${key}에서 운전자 ${username}의 매칭 취소.`);
          return;
        }

        if (this.matchingRooms.has(username)) {
          this.matchingRooms.delete(username);
          console.log(`매칭 그룹에서 운전자 ${username}을 제거했습니다.`);
        }

        console.log(`${username}은 매칭 큐에도 없고, 매칭 프로세스 중도 아닙니다.`);
      }
    }

    // 탑승자인 경우
    if (user.role === "passenger") {
      const passengerQueue = this.passengerQueues.get(key) || [];
      const passengerExistsInQueue = passengerQueue.some((passenger) => passenger.username === username);

      this.cancellations.set(cancellationKey, true);

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

      // 임시 매칭 목록에서 제거
      this.temporarilyMatchedPassengers.delete(username);
    }

  }

  /**
   * 시간 범위 비교
   */
  private isWithinTimeRange(time1: string, time2: string): boolean {
    const time1Date = new Date(time1);
    const time2Date = new Date(time2);
    const diff = Math.abs(time1Date.getTime() - time2Date.getTime());
    return diff <= 5 * 60 * 1000; // 5분 이내
  }


  // 매칭 진행 상황 확인 메서드
  async getMatchingStatus(user: Users, key: string): Promise<{status: MatchingStatus; rideRequestId: number }> {
    if (user.role === 'driver') {
      // 운전자인 경우
      if (this.matchingRooms.has(user.username)) {
        // return MatchingStatus.Matched; // 매칭 성공
        const room = this.matchingRooms.get(user.username)!;
        return { status: MatchingStatus.Matched, rideRequestId: room.rideRequestId }; // rideRequestId 반환
      } else if (this.driverQueues.get(key)?.some((driver) => driver.username === user.username)) {
        return { status: MatchingStatus.Waiting, rideRequestId: -1 };
      } else if (this.processingDrivers.has(user.username)){
        return { status: MatchingStatus.Waiting, rideRequestId: -1 };
      } else {
        return { status: MatchingStatus.NotFound, rideRequestId: -1 };// 매칭 정보 없음
      }
    } else if (user.role === 'passenger') {
      // 탑승자인 경우
      // const isMatched = Array.from(this.matchingRooms.values()).some((room) =>
      //   room.passengers.some((passenger) => passenger.username === user.username)
      // );

      const matchedRoom = Array.from(this.matchingRooms.values()).find((room) =>
        room.passengers.some((passenger) => passenger.username === user.username)
      );

      if (matchedRoom) {
        return { status: MatchingStatus.Matched, rideRequestId: matchedRoom.rideRequestId }; // rideRequestId 반환
      } else if (this.passengerQueues.get(key)?.some((passenger) => passenger.username === user.username)) {
        return { status: MatchingStatus.Waiting, rideRequestId: -1 };
      } else {
        return { status: MatchingStatus.NotFound, rideRequestId: -1 };
      }
    } else {
      throw new Error('유효하지 않은 사용자 역할입니다.');
    }
  }



  // 개인 나가기 요청 처리 메서드
  async leaveMatch(user: Users, rideRequestId: number): Promise<void> {
    if (user.role === 'driver') {
      // 운전자일 경우, RideRequest와 관련된 모든 데이터를 삭제
      const rideRequest = await this.rideRequestsRepository.findOne({
        where: { id: rideRequestId, driver: { id: user.id } },
        relations: ['passengers'],
      });

      if (rideRequest) {
        // RidePassengers 삭제
        await this.ridePassengersRepository.delete({ rideRequest: { id: rideRequest.id } });

        // RideRequest 삭제
        await this.rideRequestsRepository.delete({ id: rideRequest.id });

        console.log(`운전자 ${user.username}의 매칭이 취소되고 모든 관련 데이터가 삭제되었습니다.`);
      } else {
        console.log(`운전자 ${user.username}의 매칭 정보를 찾을 수 없습니다.`);
        throw new UnauthorizedException('해당 매칭에 대한 권한이 없습니다.');
      }
    } else if (user.role === 'passenger') {
      // 탑승자일 경우, 해당 탑승자의 RidePassenger 데이터만 삭제
      const ridePassenger = await this.ridePassengersRepository.findOne({
        where: {
          rideRequest: { id: rideRequestId },
          passenger: { id: user.id },
        },
      });

      if (ridePassenger) {
        await this.ridePassengersRepository.delete({ id: ridePassenger.id });
        console.log(`탑승자 ${user.username}의 매칭이 취소되었습니다.`);
      } else {
        console.log(`탑승자 ${user.username}의 매칭 정보를 찾을 수 없습니다.`);
        throw new UnauthorizedException('해당 매칭에 대한 권한이 없습니다.');
      }
    }
  }


  //운행 시작 메소드
  async agreeToStartRide(user: Users, rideRequestId: number): Promise<void> {
    if (user.role === 'passenger') {
      // Update passenger's status to 'confirmed'
      const ridePassenger = await this.ridePassengersRepository.findOne({
        where: {
          rideRequest: { id: rideRequestId },
          passenger: { id: user.id },
        },
      });

      if (!ridePassenger) {
        throw new NotFoundException('매칭 정보를 찾을 수 없습니다.');
      }

      ridePassenger.status = 'confirmed';
      await this.ridePassengersRepository.save(ridePassenger);

      console.log(`탑승자 ${user.username}이 운행을 동의하였습니다.`);
    } else if (user.role === 'driver') {
      // Check if all passengers have confirmed
      const rideRequest = await this.rideRequestsRepository.findOne({
        where: { id: rideRequestId, driver: { id: user.id } },
        relations: ['passengers', 'passengers.passenger'],
      });

      if (!rideRequest) {
        throw new NotFoundException('운행 정보를 찾을 수 없습니다.');
      }

      const unconfirmedPassengers = rideRequest.passengers.filter(
        (rp) => rp.status !== 'confirmed',
      );

      if (unconfirmedPassengers.length > 0) {
        throw new BadRequestException('아직 모든 탑승자가 운행을 동의하지 않았습니다.');
      }

      // Create a new trip
      const newTrip = this.tripsRepository.create({
        rideRequest: rideRequest,
        start_time: new Date(),
      });

      await this.tripsRepository.save(newTrip);

      console.log(`운전자 ${user.username}이 운행을 시작하였습니다.`);
    } else {
      throw new BadRequestException('유효하지 않은 사용자 역할입니다.');
    }
  }


  async completeRide(user: Users, rideRequestId: number): Promise<void> {
    if (user.role !== 'driver') {
      throw new UnauthorizedException('운전자만 운행을 완료할 수 있습니다.');
    }

    // Check if the driver is associated with the rideRequestId
    const rideRequest = await this.rideRequestsRepository.findOne({
      where: { id: rideRequestId, driver: { id: user.id } },
      relations: ['passengers', 'passengers.passenger'],
    });

    if (!rideRequest) {
      throw new NotFoundException('운행 정보를 찾을 수 없습니다.');
    }

    // Check if all passengers have confirmed
    const unconfirmedPassengers = rideRequest.passengers.filter(
      (rp) => rp.status !== 'confirmed',
    );

    if (unconfirmedPassengers.length > 0) {
      throw new BadRequestException('아직 모든 탑승자가 운행을 동의하지 않았습니다.');
    }

    // Update the ride request status to 'completed'
    rideRequest.status = 'completed';
    await this.rideRequestsRepository.save(rideRequest);

    // Update the trip's end_time
    const trip = await this.tripsRepository.findOne({
      where: { rideRequest: { id: rideRequestId } },
    });

    if (trip) {
      trip.end_time = new Date();
      await this.tripsRepository.save(trip);
    }

    // Remove users from activeUsers and delete matching room
    if (this.matchingRooms.has(user.username)) {
      const room = this.matchingRooms.get(user.username)!;
      // Remove users from activeUsers
      this.activeUsers.delete(user.username);
      room.passengers.forEach((passenger) => {
        this.activeUsers.delete(passenger.username);
      });
      // Delete the matching room
      this.matchingRooms.delete(user.username);
      console.log(`매칭룸에서 운전자 ${user.username}을 제거했습니다.`);
    }

    console.log(`운전자 ${user.username}이 운행을 완료하였습니다.`);
  }


  // 탑승자 강퇴 메서드
  async kickPassenger(driver: Users, passengerId: number): Promise<void> {
    if (driver.role !== 'driver') {
      throw new UnauthorizedException('탑승자를 강퇴할 권한이 없습니다.');
    }

    // 운전자의 RideRequest 가져오기
    const rideRequest = await this.rideRequestsRepository.findOne({
      where: { driver: { id: driver.id } },
      relations: ['passengers'],
    });

    if (!rideRequest) {
      throw new Error('운전자의 매칭 정보를 찾을 수 없습니다.');
    }

    // 강퇴할 탑승자가 해당 RideRequest에 속해 있는지 확인
    const passenger = await this.userRepository.findOne({ where: { id: passengerId } });
    if (!passenger) {
      throw new Error('강퇴할 탑승자를 찾을 수 없습니다.');
    }

    const ridePassenger = await this.ridePassengersRepository.findOne({
      where: {
        rideRequest: { id: rideRequest.id },
        passenger: { id: passengerId },
      },
    });

    if (!ridePassenger) {
      throw new Error('강퇴할 탑승자가 이 매칭에 참여하고 있지 않습니다.');
    }

    // RidePassenger 삭제
    await this.ridePassengersRepository.delete({ id: ridePassenger.id });

    console.log(`운전자 ${driver.username}이 탑승자 ${passenger.username}을 강퇴하였습니다.`);
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
