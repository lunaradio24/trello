import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MoveCardDto {
  /**
   * 카드가 이동하게 될 리스트의 ID
   * @example 1
   */
  @IsNumber()
  @IsNotEmpty({ message: '대상 리스트를 선택해주세요.' })
  listId: number;

  /**
   * 이동할 기점의 카드 ID
   * @example 1
   */
  @IsNumber()
  @IsOptional()
  targetCardId?: number;

  /**
   * 이동할 위치
   * @example "before"
   */
  @IsString()
  @IsNotEmpty({ message: '위치를 입력해주세요.' })
  position: 'before' | 'after';
}
