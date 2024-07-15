import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { CardAssignee } from './entities/card_assignee.entity';
import { List } from 'src/list/entities/list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card, CardAssignee, List])],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
