import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';
import { EmailModule } from 'src/email/email.module';
import { RedisModule } from 'src/redis/redis.module';
import { ListService } from 'src/list/list.service';
import { List } from 'src/list/entities/list.entity';
import { Card } from 'src/card/entities/card.entity';
import { CardService } from 'src/card/card.service';
import { CardAssignee } from 'src/card/entities/card_assignee.entity';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Board, List, Card, CardAssignee, BoardMember, User])],
  controllers: [BoardController],
  providers: [BoardService, ListService, CardService, EmailService],
})
export class BoardModule {}
