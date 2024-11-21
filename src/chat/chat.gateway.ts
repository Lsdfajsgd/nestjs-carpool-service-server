import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { Injectable } from '@nestjs/common';

//devlop branch내용
@WebSocketGateway(81, { namespace: 'chatroom' })
@Injectable()
export class ChatGateway {
  constructor(
    private chatService: ChatService,
  ) { }
  @WebSocketServer()
  server: Server;

  //방변수 설정
  private rooms: { [room: string]: Set<number> } = {};

  // 방별 메세지 로그를 저장
  private messageLogs: { [room: string]: Array<{ id: number; message: string }> } = {};

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];

    try {
      const userId = await this.chatService.validateToken(token); // await를 통해 Promise문제 해결+ ChatService를 통해 토큰 검증
      client.data.userId = userId; //클라이언트 데이터에 userId저장

      //사용자가 속한 방 확인 및 입장
      const matchedRides = await this.chatService.createChatRoomForMatchedRides();
      matchedRides.forEach((roomName) => {
        if (this.chatService.getUsersInRoom(roomName).includes(userId)) {
          client.join(roomName);
          console.log(`User ${userId} automatically joined room ${roomName}`);
        }
      });
      console.log(`Client connected: user_Id[${userId}]`);
    } catch (error) {
      client.emit('error', { message: error.message });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];
    const userId = await this.chatService.validateToken(token);
    console.log(`Client disconnected: user_Id[${userId}]`);
  }


  private broadcast(event: string, client: Socket, message: any) {
    //현재 방의 다른 사용자에게만 메세지 전송
    const rooms = Array.from(client.rooms);
    rooms.forEach((room) => {
      client.to(room).emit(event, message);
    });
  }

  @SubscribeMessage('send')
  sendMessage(
    @MessageBody() data: [string, string], //room과 message만 전달받음
    @ConnectedSocket() client: Socket,
  ) {
    const [room, message] = data;
    const userId = client.data.userId; // handleConnection에서 저장된 userId 활용
    
    // userId가 해당 방에 속해 있는지 확인
    if (!this.chatService.isUserInRoom(room, userId)) {
      console.log(`Send failed: User "user_Id${userId}" is not a member of the room "${room}". `);
      client.emit('error', { message: `You are not a member of the room "${room}".` });
      return;
    }

    console.log(`users_Id${userId}님이 ${room}방에 메시지를 보냈습니다: ${message}`);

    // 메시지 로그에 저장
    if (!this.messageLogs[room]) {
      this.messageLogs[room] = [];
    }
    this.messageLogs[room].push({ id: userId, message });

    // 특정 방에 있는 모든 사용자에게 메시지 전송
    this.server.to(room).emit('message', { userId, message });
  }

  @SubscribeMessage('leave')
  leaveRoom(
    @MessageBody() room: string, //room만 전달받음
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId; // handleConnection에서 저장된 userId 활용

    // 방이 존재하지 않는 경우 처리
    // if (!this.rooms[room]) {
    //   console.log(`Leave failed: Room "${room}" does not exist.`);
    //   client.emit('error', { message: `Room "${room}" does not exist.` });
    //   return;
    // }

    // 사용자가 방에 속해 있지 않은 경우 처리
    if (!this.chatService.isUserInRoom(room, userId)) {
      console.log(`Leave failed: User "user_Id${userId}" is not in room "${room}".`);
      client.emit('error', {
        message: `You are not a member of the room "${room}".`,
      });
      return;
    }

    // 방에서 사용자 제거
    this.chatService.removeUserFromRoom(room, userId);

    // 방이 비어 있으면 방과 메시지 로그 삭제
    if (this.chatService.getUsersInRoom(room).length === 0) {
      delete this.rooms[room];
      delete this.messageLogs[room];
      console.log(`Room "${room}" has been deleted along with its message logs.`);
    }

    console.log(`users_Id[${userId}]님이 ${room}방에서 나갔습니다.`);
    client.leave(room);

    // 나머지 사용자에게 알림
    const leaveMessage = `User user_Id${userId} has left the room.`;
    this.server.to(room).emit('leaveRoom', { room, message: leaveMessage });

    // 방에 남아 있는 사용자 목록 전송
    const updatedUserList = this.chatService.getUsersInRoom(room);
    if (updatedUserList.length > 0) {
      this.server.to(room).emit('userList', { room, users: updatedUserList });
    }
  }

  //유저 목록 출력
  @SubscribeMessage('getUserList')
  getUserList(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId; // 현재 사용자의 username

    // 방이 존재하지 않는 경우 처리
    // if (!this.rooms[room]) {
    //   console.log(`User list request failed: Room "${room}" does not exist.`);
    //   client.emit('error', { message: `Room "${room}" does not exist.` });
    //   return;
    // }

    // 사용자가 방에 없는 경우 처리
    if (!this.chatService.isUserInRoom(room, userId)) {
      console.log(`Access denied: User "user_Id${userId}" is not in room "${room}".`);
      client.emit('error', {
        message: `You are not a member of the room "${room}".`,
      });
      return;
    }

    // 방에 있는 사용자 목록 가져오기
    const userList = this.chatService.getUsersInRoom(room);

    // 빈 방인 경우 로깅
    if (userList.length === 0) {
      console.log(`User list request: Room "${room}" is empty.`);
    }

    console.log(`User list for room "${room}":`, userList);

    // 사용자 목록 반환
    client.emit('userList', { room, users: userList });
  }

  //메세지 로그 출력
  @SubscribeMessage('getMessageLog')
  getMessageLog(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId; // 현재 사용자의 username

    // 사용자가 방에 속해 있지 않은 경우 처리
    if (!this.chatService.isUserInRoom(room, userId)) {
      console.log(`Access denied: User "user_Id${userId}" is not in room "${room}".`);
      client.emit('error', {
        message: `You are not a member of the room "${room}".`,
      });
      return;
    }

    // 메시지 로그 가져오기
    const logs = this.messageLogs[room] || [];
    // 빈 로그 처리 및 로깅
    if (logs.length === 0) {
      console.log(`Message log request: Room "${room}" has no messages.`);
    } else {
      console.log(`Message log for room "${room}":`, logs);
    }

    // 클라이언트에 메시지 로그 반환
    client.emit('messageLog', { room, logs });
  }

}