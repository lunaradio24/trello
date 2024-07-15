import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from './common/exception-filters/http-error.filter';
import { ConfigService } from '@nestjs/config';
import { LoggingInterceptor } from './common/interceptors/logging/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT');

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());

  const config = new DocumentBuilder()
    .setTitle('trello project')
    .setDescription('브라운 박사님의 은밀한 업무 방법론')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }) // JWT 사용을 위한 설정
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 새로고침 시에도 JWT 유지하기
      tagsSorter: 'alpha', // API 그룹 정렬을 알파벳 순으로
      operationsSorter: 'alpha', // API 그룹 내 정렬을 알파벳 순으로
    },
  });

  await app.listen(port);
}

bootstrap();
