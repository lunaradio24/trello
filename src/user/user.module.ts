import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Comment } from '../comment/entities/comment.entity';
import { S3Service } from 'src/s3/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Comment])],
  controllers: [UserController],
  providers: [UserService, S3Service],
})
export class UserModule {}
