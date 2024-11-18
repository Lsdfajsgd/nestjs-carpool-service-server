import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ChatService {
    private rooms: { [room: string]: Set<string> } = {};

    constructor(private jwtService: JwtService) {}

    validateToken(token: string): string {
        if (!token) {
            throw new UnauthorizedException('Token is missing');
        }

        try {
            const payload = this.jwtService.verify(token, { secret: 'Secret1234' });
            return payload.username;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    addUserToRoom(room: string, username: string) {
        if (!this.rooms[room]) {
            this.rooms[room] = new Set();
        }
        this.rooms[room].add(username);
    }

    removeUserFromRoom(room: string, username: string) {
        if (this.rooms[room]) {
            this.rooms[room].delete(username);
            if (this.rooms[room].size === 0) {
                delete this.rooms[room];
            }
        }
    }

    getUsersInRoom(room: string): string[] {
        return this.rooms[room] ? Array.from(this.rooms[room]) : [];
    }

    isUserInRoom(room: string, username: string): boolean {
        return !!this.rooms[room]?.has(username);
    }
}
