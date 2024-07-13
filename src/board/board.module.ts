import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { ListService } from 'src/list/list.service';
import { List } from 'src/list/entities/list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Board, List])],
  controllers: [BoardController],
  providers: [BoardService, ListService],
})
export class BoardModule {}
