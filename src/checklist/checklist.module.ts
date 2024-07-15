import { Module } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from 'src/card/entities/card.entity';
import { Checklist } from './entities/checklist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card, Checklist])],
  providers: [ChecklistService],
  controllers: [ChecklistController],
})
export class ChecklistModule {}
