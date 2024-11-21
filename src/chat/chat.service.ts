import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from 'src/auth/user.repository';
import { User } from 'src/auth/user.entity';
import { DataSource } from 'typeorm';
import { RidePassengersEntity } from '../matching/ride-passengers.entity';
import { RideRequestsEntity } from '../matching/ride-requests.entity';

@Injectable()
export class ChatService {
    private rooms: { [room: string]: Set<number> } = {};
    private messageLogs: { [room: string]: Array<{ id: number; message: string }> } = {};

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource, // DataSource 주입
    ) { }

    //방을 그룹화해서 배열으로 보여줌
    async createChatRoomForMatchedRides(): Promise<string[]> {
        const matchedRides = await this.dataSource.getRepository(RideRequestsEntity).find({
            where: { status: "matched"},
            relations: ['driver', 'passengers.passenger'],
        });

        const createdRooms: string[] = [];

        for (const ride of matchedRides) {
            const roomName = `ride_request_${ride.id}`;
            this.rooms[roomName] = new Set();

            // 운전자를 추가
            if (ride.driver) {
                this.rooms[roomName].add(ride.driver.id);
            }

            // 탑승자를 추가
            ride.passengers.forEach((passenger) => {
                this.rooms[roomName].add(passenger.passenger.id);
            });

            createdRooms.push(roomName);
        }

        return createdRooms;
    }
    //rideRequest의 id가져오기
    async getRideRequestById(rideRequestId: number): Promise<RideRequestsEntity> {
        return this.dataSource.getRepository(RideRequestsEntity).findOne({
            where: { id: rideRequestId },
        });
    }
    //rideRequest의 status 상태가 matched인지 가쟈오기
    async getMatchedRidesForUser(userId: number): Promise<RideRequestsEntity[]> {
        return this.dataSource.getRepository(RideRequestsEntity).find({
            where: [
                { driver: { id: userId }, status: 'matched' },
            ],
            relations: ['driver'],
        });
    }


    async validateToken(token: string): Promise<number> {
        if (!token) {
            throw new UnauthorizedException('Token is missing');
        }
        try {
            const secret = this.configService.get<string>('JWT_SECRET');
            // console.log('JWT Secret:', secret); // JWT 시크릿 확인
            const payload = this.jwtService.verify(token, { secret });
            // console.log('Token payload:', payload); // 페이로드 확인
            if (!payload.id) {
                throw new UnauthorizedException('Invalid token payload');
            }
            // 여기서 DB를 확인해 사용자 유효성을 검증
            const userRepository = this.dataSource.getRepository(User); // 수동 접근
            const user = await userRepository.findOne({ where: { id: payload.id } });
            // console.log('User found:', user); // 사용자 확인
            if (!user) {
                throw new UnauthorizedException('Invalid user ID in token');
            }
            return payload.id; // 토큰에서 userid 반환

        } catch (error) {
            console.error('Token validation error:', error.message); // 에러 메시지 출력
            throw new UnauthorizedException('Invalid token');
        }
    }

    addUserToRoom(room: string, id: number) {
        if (!this.rooms[room]) {
            this.rooms[room] = new Set();
        }
        this.rooms[room].add(id);
    }

    removeUserFromRoom(room: string, id: number) {
        if (this.rooms[room]) {
            this.rooms[room].delete(id);
            if (this.rooms[room].size === 0) {
                delete this.rooms[room];
            }
        }
    }

    getUsersInRoom(room: string): number[] {
        return this.rooms[room] ? Array.from(this.rooms[room]) : [];
    }

    isUserInRoom(room: string, id: number): boolean {
        return !!this.rooms[room]?.has(id);
    }

    deleteRoom(room: string) {
        if (this.rooms[room]) {
            delete this.rooms[room];
            console.log(`Room "${room}" has been deleted.`);
        }
    }

    validateRoomAndUser(room: string, userId: number): void {
        if (!this.rooms[room]) {
            throw new Error(`Room "${room}" does not exist.`);
        }
        if (!this.isUserInRoom(room, userId)) {
            throw new Error(`User "user_Id${userId}" is not a member of the room "${room}".`);
        }
    }

    addMessageToLog(room: string, message: { id: number; message: string }): void {
        if (!this.rooms[room]) {
            throw new Error(`Room "${room}" does not exist.`);
        }
        if (!this.messageLogs[room]) {
            this.messageLogs[room] = [];
        }
        this.messageLogs[room].push(message);
    }

    getMessageLogs(room: string): Array<{ id: number; message: string }> {
        if (!this.rooms[room]) {
            throw new Error(`Room "${room}" does not exist.`);
        }
        return this.messageLogs[room] || [];
    }
}
