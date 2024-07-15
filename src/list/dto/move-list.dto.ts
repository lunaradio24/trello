import { IsNotEmpty, IsNumber } from 'class-validator';

export class MoveListDto {
  /**
   * 보드 ID
   * @example 1
   */
  @IsNumber()
  @IsNotEmpty({ message: '보드의 ID를 입력해주세요.' })
  boardId: number;

  /**
   * 이동할 위치
   * @example 2
   */
  @IsNumber()
  @IsNotEmpty({ message: '새로 옮길 위치를 입력해주세요.' })
  newPosition: number;
}
