import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service'
import { AuthModule } from '../auth/auth.module';
import { JwtConfigModule } from 'src/jwt-config/jwt-config.module';
import { ConfigModule } from '@nestjs/config';


@Module({
    imports: [
        AuthModule,
        ConfigModule,
        JwtConfigModule,
    ],
    providers: [ChatGateway, ChatService],
    exports: [ChatService], // 필요 시 다른 모듈에서 ChatService 사용 가능
})
export class ChatModule { }
