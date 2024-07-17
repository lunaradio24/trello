import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChecklistDto {
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
