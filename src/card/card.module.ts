import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { CardAssignee } from './entities/card-assignee.entity';
import { List } from '../list/entities/list.entity';
import { User } from '../user/entities/user.entity';
import { BoardMember } from 'src/board/entities/board-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card, CardAssignee, List, User, BoardMember])],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
