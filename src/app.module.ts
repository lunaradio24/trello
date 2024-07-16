import Joi from 'joi';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CommentModule } from './comment/comment.module';
import { ListsModule } from './list/list.module';
import { EmailModule } from './email/email.module';
import { RedisModule } from './redis/redis.module';
import { CardModule } from './card/card.module';
import { BoardModule } from './board/board.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ChecklistModule } from './checklist/checklist.module';
import { S3Module } from './s3/s3.module';
import { AttachmentModule } from './attachment/attachment.module';

const typeOrmModuleOptions = {
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
    namingStrategy: new SnakeNamingStrategy(),
    type: 'mysql',
    host: configService.get('DB_HOST'),
    port: Number(configService.get('DB_PORT')),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get('DB_SYNC'),
    logging: true,
  }),
  inject: [ConfigService],
};

const mailerModuleOptions = {
  useFactory: async (configService: ConfigService) => ({
    transport: {
      // host: configService.get('EMAIL_HOST'),
      auth: {
        user: configService.get('EMAIL_USERNAME'),
        pass: configService.get('EMAIL_PASSWORD'),
      },
    },
  }),
  inject: [ConfigService],
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigModule을 전역 모듈로 설정
      validationSchema: Joi.object({
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_NAME: Joi.string().required(),
        DB_SYNC: Joi.boolean().required(),
      }),
    }),
    MailerModule.forRootAsync(mailerModuleOptions),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    AuthModule,
    UserModule,
    CommentModule,
    ChecklistModule,
    ListsModule,
    EmailModule,
    RedisModule,
    CardModule,
    BoardModule,
    AttachmentModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..'), // 프로젝트 루트 디렉토리를 가리키도록 설정
      serveRoot: '/', // 정적 파일의 접근 경로 설정
    }),
    S3Module,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
