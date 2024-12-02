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

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];

    try {
      const userId = await this.chatService.validateToken(token); // await를 통해 Promise문제 해결+ ChatService를 통해 토큰 검증
      const userName = await this.chatService.getUserNameById(userId);
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

      console.log(`Client connected: user_Name[${userName}]`);
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
  async sendMessage(
      @MessageBody() data: { room: string; message: string; coordinate?: { latitude: number; longitude: number } },
      @ConnectedSocket() client: Socket,
  ) {
      const { room, message, coordinate } = data;
      const userId = client.data.userId; // handleConnection에서 저장된 userId 활용
      const userName = await this.chatService.getUserNameById(userId);

      try {
          // 방과 사용자가 유효한지 확인
          this.chatService.validateRoomAndUser(room, userId);
          //사용자 이름 조회

          if (!userName) {
              throw new Error('User name not found.');
          }

          // 메시지 로그에 추가
          this.chatService.addMessageToLog(room, { name: userName, message });

          // 메시지를 보낸 사용자가 driver인지 확인
          const rideRequestId = parseInt(room.replace('ride_request_', ''), 10);
          const rideRequest = await this.chatService.getRideRequestById(rideRequestId);

          if (!rideRequest) {
              throw new Error(`Ride request with ID ${rideRequestId} not found.`);
          }

          const isDriver = rideRequest.driver?.id === userId;

          // 메시지 생성
          const payload: any = {userName, message};
          if (isDriver && coordinate) {
              payload.coordinate = coordinate; // driver인 경우에만 위치 정보 추가
              console.log(`Driver user_name[${userName}] sent a message with location:`, coordinate);
          }

          // 방에 메시지 브로드캐스트
          this.server.to(room).emit('message', payload);
          console.log(`{ (${room}) user_Id [${userId}] } : `, payload);

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
    const userName = this.chatService.getUserNameById(userId);

    try {
      this.chatService.validateRoomAndUser(room, userId);
      this.chatService.removeUserFromRoom(room, userId);

      if (this.chatService.getUsersInRoom(room).length === 0) {
        this.chatService.deleteRoom(room);
        this.chatService.deleteMessage(room);
      }

      client.leave(room);
      const leaveMessage = `User user_Name${userName} has left the room.`;
      this.server.to(room).emit('leaveRoom', { room, message: leaveMessage });

      const updatedUserList = this.chatService.getUsersInRoom(room);
      if (updatedUserList.length > 0) {
        this.server.to(room).emit('userList', { room, users: updatedUserList });
      }

      console.log(`user_Name[${userName}] left room [${room}].`);
    } catch (error) {
      console.error(error.message);
      client.emit('error', { message: error.message });
    }
    client.disconnect();
  }

  //유저 목록 출력
  @SubscribeMessage('getUserList')
async getUserList(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
) {
    const userId = client.data.userId;

    try {
        // 방과 사용자가 유효한지 확인
        this.chatService.validateRoomAndUser(room, userId);

        // 방의 모든 사용자 ID 가져오기
        const userIds = this.chatService.getUsersInRoom(room);

        // 사용자 이름 조회
        const userDetails = await Promise.all(
            userIds.map(async (id) => {
                const name = await this.chatService.getUserNameById(id);
                const role = await this.chatService.getUserRoleById(id);
                return {
                  name: name || `Unknown(${id})`, // 이름이 없을 경우 ID 표시
                  role: role || `Unknown`,
                };
            })
        );
        // 사용자 목록을 클라이언트로 전송
        client.emit('userList', { room, users: userDetails });
        console.log(`User list for room [${room}]:`, userDetails);
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
    const userName = this.chatService.getUserNameById(userId);

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