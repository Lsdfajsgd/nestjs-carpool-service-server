import * as dotenv from 'dotenv';
dotenv.config(); // .env 파일을 로드하여 process.env에 환경 변수를 설정

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
