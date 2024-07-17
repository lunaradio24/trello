import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class MoveListDto {
  /**
   * 이동할 기점의 인덱스
   * @example 3
   */
  @IsInt()
  @IsNotEmpty({ message: '이동할 곳을 입력해주세요.' })
  targetIndex: number;
}
