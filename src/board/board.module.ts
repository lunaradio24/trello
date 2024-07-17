import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';
import { ListService } from '../list/list.service';
import { List } from '../list/entities/list.entity';
import { Card } from '../card/entities/card.entity';
import { CardService } from '../card/card.service';
import { CardAssignee } from '../card/entities/card-assignee.entity';
import { EmailService } from '../email/email.service';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Board, List, Card, CardAssignee, BoardMember, User])],
  controllers: [BoardController],
  providers: [BoardService, ListService, CardService, EmailService],
})
export class BoardModule {}
