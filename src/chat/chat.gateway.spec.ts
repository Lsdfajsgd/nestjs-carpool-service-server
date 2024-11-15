import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create< NestExpressApplication>(AppModule);
   // CORS 설정
  app.enableCors({
    origin: '*', // 필요에 맞게 변경 (예: 특정 도메인만 허용하려면 문자열이나 배열로 지정)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,// 인증된 요청에 대해 허용
  });
 // 정적 자산 제공
  app.useStaticAssets(join(__dirname, '..', 'static'), {
    prefix: '/static/',
  });
  
  await app.listen(3000);
}
bootstrap();