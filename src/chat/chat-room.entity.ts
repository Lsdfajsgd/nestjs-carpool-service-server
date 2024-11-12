// chat-room.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, CreateDateColumn, OneToOne } from 'typeorm';
import { Message } from './message.entity';
import { User } from 'src/auth/user.entity';
import { Transform } from 'class-transformer';
import { format } from 'date-fns';

export enum ChatRoomStatus{
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}
//devlop branch작업

@Entity()
export class ChatRoom {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @OneToOne(()=> User)
    from_id: number;

    @Column()
    @OneToOne(()=> User)
    to_id: number;

    @Column({ unique: true })
    subject: string;

    @Column({
        type: 'enum',
        enum: ChatRoomStatus,
        default: ChatRoomStatus.INACTIVE
    })
    status: ChatRoomStatus;

    @CreateDateColumn()
    @Transform(({ value }) => format(value,'yyyy-MM-dd HH:mm-ss'))
    last_message_time: Date; //마지막 전송된 시간을 저장

    @CreateDateColumn()
    @Transform(({ value }) => format(value,'yyyy-MM-dd HH:mm-ss'))
    created_at: Date; //채팅방이 생성된 시간을 저장

    @OneToMany(() => Message, message => message.chatRoom)
    messages: Message[];

}
