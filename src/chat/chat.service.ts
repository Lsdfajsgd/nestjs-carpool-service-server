import { Injectable, NotFoundException } from '@nestjs/common';
import { Message } from './message.entity';
import { Repository } from 'typeorm';
import { ChatRoom, ChatRoomStatus } from './chat-room.entity';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Message) private messageRepository: Repository<Message>,
        @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>,
    ){}

    async createChatRoom(from_Id: number, to_Id: number, subject: string, status: ChatRoomStatus = ChatRoomStatus.INACTIVE){
        const chatRoom = this.chatRoomRepository.create({
            from_Id,
            to_Id,
            subject,
            status,
        });
        return this.chatRoomRepository.save(chatRoom);
    }

    async findChatRoomById(id:number){
        return this.chatRoomRepository.findOne({where : {id}});
    }

    async saveMessage(content: string, sender_Id: number, chatRoom_Id: number, is_from_senders: boolean, read: boolean){
        const chatRoom = await this.chatRoomRepository.findOne({
            where: {id: chatRoom_Id},
            relations: ['from', 'to'],
        });

        if(!chatRoom){
            throw new NotFoundException(`Chat room with ID ${chatRoom_Id} not found`);
        }

        const message = this.messageRepository.create({
            content,
            chatRoom_Id,
            sender_Id,
            is_from_senders,
            read,
            
        });

        return this.messageRepository.save(message);
    }
    
    async getMessages(chatRoomId: number){
        return this.messageRepository.find({
            where: { chatRoom_Id: chatRoomId},
            order: {send_time:"ASC"}
        });
    }
}
