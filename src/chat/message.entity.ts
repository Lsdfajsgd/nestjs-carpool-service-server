// message.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from 'src/auth/user.entity';
import { Transform } from 'class-transformer';
import { format } from 'date-fns';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;


    @Column()
    chatRoom_Id: number;

    @Column()
    sender_Id: number;

    @Column()
    is_from_senders: boolean;

    @Column()
    read: boolean;

    @Column()
    content: string; //메세지 내용

    @CreateDateColumn()
    @Transform(({ value }) => format(value,'yyyy-MM-dd HH:mm-ss'))
    send_time: Date; //전송된 시간을 자동으로 저장

    @CreateDateColumn()
    @Transform(({ value }) => format(value,'yyyy-MM-dd HH:mm-ss'))
    created_at: Date; //전송된 시간을 자동으로 저장


}
