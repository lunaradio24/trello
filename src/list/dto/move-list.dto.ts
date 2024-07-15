import { IsNotEmpty, IsNumber } from 'class-validator';

export class MoveListDto {
  @IsNumber()
  @IsNotEmpty({ message: '보드의 ID를 입력해주세요.' })
  boardId: number;

  @IsNumber()
  @IsNotEmpty({ message: '새로 옮길 위치를 입력해주세요.' })
  newPosition: number;
}
