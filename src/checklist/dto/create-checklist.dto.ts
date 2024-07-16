import { PickType } from '@nestjs/swagger';
import { Checklist } from '../entities/checklist.entity';
import { IsDate, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChecklistDto extends PickType(Checklist, ['cardId', 'content', 'dueDate']) {
  /**
   * 카드 ID
   * @example 1
   */
  @IsInt()
  @IsNotEmpty()
  cardId: number;

  /**
   * 체크리스트 내용
   * @example "프로틴 먹기"
   */
  @IsString()
  @IsNotEmpty()
  content: string;

  /**
   * 마감일
   * @example "2024-07-17T12:00:00.000Z"
   */
  @IsDateString()
  @IsOptional()
  dueDate: Date;
}
