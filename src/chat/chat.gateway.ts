import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway(81,{ namespace: 'chatroom' })
export class ChatGateway {
  @WebSocketServer() 
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('enter')
  connectSomeone(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    const [nickname, room] = data;
    console.log(`${nickname}님이 코드: ${room}방에 접속했습니다.`);
    const comeOn = `${nickname}님이 입장했습니다.`;
    //방에 있는 모든 사용자에게 메세지 전송
    client.join(room);
    this.server.emit('comeOn' + room, comeOn);
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
    @MessageBody() data: [string, string, string], 
    @ConnectedSocket() client: Socket,
) {
    const [room, nickname, message] = data;
    console.log(`${client.id} : ${data}`);
    this.broadcast(room, client, [nickname, message]);
  }

  @SubscribeMessage('leave')
leaveRoom(
  @MessageBody() data: [string, string], 
  @ConnectedSocket() client: Socket,
) {
  const [nickname,room] = data;
  console.log(`${nickname}님이 ${room}방에서 나갔습니다.`);
  client.leave(room);

  // Broadcast to other users in the room that the user has left
  const leaveMessage = `${nickname}님이 나갔습니다.`;
  this.server.to(room).emit('leaveRoom' + room, leaveMessage);
}
}