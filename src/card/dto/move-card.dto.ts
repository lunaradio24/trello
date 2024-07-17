import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class MoveCardDto {
  /**
   * 카드가 이동하게 될 리스트의 ID
   * @example 1
   */
  @IsNumber()
  @IsNotEmpty({ message: '대상 리스트를 선택해주세요.' })
  listId: number;

  /**
   * 이동할 기점의 인덱스
   * @example 3
   */
  @IsInt()
  @IsNotEmpty({ message: '이동할 곳을 입력해주세요.' })
  targetIndex: number;
}
