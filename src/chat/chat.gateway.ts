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
  // private rooms: { [room: string]: Set<number> } = {};

  // 방별 메세지 로그를 저장
  // private messageLogs: { [room: string]: Array<{ id: number; message: string }> } = {};

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];

    try {
      const userId = await this.chatService.validateToken(token); // await를 통해 Promise문제 해결+ ChatService를 통해 토큰 검증
      client.data.userId = userId; //클라이언트 데이터에 userId저장

      //사용자가 속한 방 확인 및 입장
      const matchedRides = await this.chatService.createChatRoomForMatchedRides();
    
      // 모든 방의 상태가 유효하면 연결
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

  // 클라이언트 연결 해제 처리
  async handleDisconnect(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];

    try {
      const userId = await this.chatService.validateToken(token);
      console.log(`Client disconnected: user_Id[${userId}]`);
    } catch (error) {
      console.error('Error during disconnection:', error.message);
    }
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

    try {
      this.chatService.validateRoomAndUser(room, userId);
      this.chatService.addMessageToLog(room, { id: userId, message });
      this.server.to(room).emit('message', { userId, message });
      console.log(`{ (${room}) user_Id [${userId}] } : `, message)
    } catch (error) {
      console.error(error.message);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leave')
  leaveRoom(
    @MessageBody() room: string, //room만 전달받음
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId; // handleConnection에서 저장된 userId 활용

    try {
      this.chatService.validateRoomAndUser(room, userId);
      this.chatService.removeUserFromRoom(room, userId);

      if (this.chatService.getUsersInRoom(room).length === 0) {
        this.chatService.deleteRoom(room);
      }

      client.leave(room);
      const leaveMessage = `User user_Id${userId} has left the room.`;
      this.server.to(room).emit('leaveRoom', { room, message: leaveMessage });

      const updatedUserList = this.chatService.getUsersInRoom(room);
      if (updatedUserList.length > 0) {
        this.server.to(room).emit('userList', { room, users: updatedUserList });
      }

      console.log(`user_Id[${userId}] left room [${room}].`);
    } catch (error) {
      console.error(error.message);
      client.emit('error', { message: error.message });
    }
    client.disconnect();
  }

  //유저 목록 출력
  @SubscribeMessage('getUserList')
  getUserList(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId; // 현재 사용자의 username

    try {
      this.chatService.validateRoomAndUser(room, userId);
      const userList = this.chatService.getUsersInRoom(room);
      client.emit('userList', { room, users: userList });
      console.log(`User list for room [${room}]:`, userList);
    } catch (error) {
      console.error(error.message);
      client.emit('error', { message: error.message });
    }
  }

  //메세지 로그 출력
  @SubscribeMessage('getMessageLog')
  getMessageLog(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId; // 현재 사용자의 username

    try {
      this.chatService.validateRoomAndUser(room, userId);
      const logs = this.chatService.getMessageLogs(room);
      client.emit('messageLog', { room, logs });
      console.log(`Message log for room [${room}]:`, logs);
    } catch (error) {
      console.error(error.message);
      client.emit('error', { message: error.message });
    }
  }

}