import * as dotenv from 'dotenv';
dotenv.config(); // .env 파일을 로드하여 process.env에 환경 변수를 설정

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'static'));

  await app.listen(3000);
}

bootstrap();

