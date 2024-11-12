import { Injectable, NotFoundException } from '@nestjs/common';
import { Message } from './message.entity';
import { Repository } from 'typeorm';
import { ChatRoom, ChatRoomStatus } from './chat-room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { UserRepository } from 'src/auth/user.repository';


@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Message) private messageRepository: Repository<Message>,
        @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>,
        @InjectRepository(User) private userRepository: UserRepository,
    ){}

    async createChatRoom(fromId: number, toId: number, subject: string, status: ChatRoomStatus = ChatRoomStatus.INACTIVE){
        const chatRoom = this.chatRoomRepository.create({
            from_id: fromId,
            to_id: toId,
            subject,
            status,
        });
        return this.chatRoomRepository.save(chatRoom);
    }

    async findChatRoomById(id:number){
        return this.chatRoomRepository.findOne({where : {id}});
    }

    async saveMessage(content: string, senderId: number, chatRoomId: number, isFromSenders: boolean, read: boolean){
        const chatRoom = await this.chatRoomRepository.findOne({
            where: {id: chatRoomId},
            relations: ['from', 'to'],
        });

        if(!chatRoom){
            throw new NotFoundException(`Chat room with ID ${chatRoomId} not found`);
        }

        const sender = await this.userRepository.findOne({ where: {id:senderId}});
        if(!sender){
            throw new NotFoundException(`user with ID ${senderId} not found`);
        }
        
        const message = this.messageRepository.create({
            content,
            chatRoom,
            sender,
            is_from_senders: isFromSenders,
            read,
            
        });

        return this.messageRepository.save(message);
    }
    
    async getMessages(chatRoomId: number){
        return this.messageRepository.find({
            where: { chatRoom: {id:chatRoomId}},
            relations: ['sender'],
            order: {send_time:"ASC"}
        });
    }
}
