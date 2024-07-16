import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { AuthModule } from "../auth/auth.module";
import { User } from './entities/user.entity';
import { Comment } from '../comment/entities/comment.entity';
import { S3Service } from '../s3/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Comment])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
