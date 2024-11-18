import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service'
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule], // AuthModule 가져오기
    providers: [ChatGateway, ChatService],
    exports: [ChatService], // 필요 시 다른 모듈에서 ChatService 사용 가능
})
export class ChatModule { }
