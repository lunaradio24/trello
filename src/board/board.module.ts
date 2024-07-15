import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';
import { EmailModule } from 'src/email/email.module';
import { RedisModule } from 'src/redis/redis.module';
import { User } from 'src/user/entities/user.entity';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([BoardMember, Board, User]), EmailModule, RedisModule],
  controllers: [BoardController],
  providers: [BoardService, EmailService],
})
export class BoardModule {}
