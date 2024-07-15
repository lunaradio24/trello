import { PickType } from '@nestjs/mapped-types';
import { Checklist } from '../entities/checklist.entity';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChecklistDto extends PickType(Checklist, ['cardId', 'content', 'dueDate']) {
  @IsInt()
  @IsNotEmpty()
  cardId: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDate()
  @IsOptional()
  dueDate: Date;
}
