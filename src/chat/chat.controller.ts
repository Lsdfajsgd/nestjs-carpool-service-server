import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRoomStatus } from './chat-room.entity';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService){}

    //새로운 채팅방 생성
    @Post('rooms')
    async createChatRoom(@Body() body: { fromId: number; toId: number; subject: string; status: ChatRoomStatus}){
        return this.chatService.createChatRoom(body.fromId, body.toId, body.subject, body.status);
    }

    //특정 채팅방 조회
    @Get('rooms/:roomId')
    async getChatRoom(@Param('roomId') roomId: number) {
        return this.chatService.findChatRoomById(roomId);
    }

    //메세지 전송
    @Post('rooms/:roomId/messages')
    async sendMessage(
        @Param('roomId') roomId: number,
        @Body() body: { senderId: number; content: string; isFromSenders: boolean; read: boolean }
    ) {
        return this.chatService.saveMessage(body.content, body.senderId, roomId, body.isFromSenders, body.read);
    }


    //특정 채팅방의 메세지 조회
    @Get('rooms/:roomId/messages')
    async getMessages(@Param('roomId') roomId: number) {
        return this.chatService.getMessages(roomId);
    }
}
