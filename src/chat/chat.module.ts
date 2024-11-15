import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { ChatRoom } from './chat-room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { ChatGateway } from './chat.gateway';


@Module({
  imports: [TypeOrmModule.forFeature([Message, ChatRoom, User])],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway] //ChatGateWay를 providers에 추가
})
export class ChatModule {}
