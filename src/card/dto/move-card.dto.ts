import { IsNotEmpty, IsNumber } from 'class-validator';

export class MoveCardDto {
  @IsNumber()
  @IsNotEmpty({ message: '대상 리스트를 선택해주세요.' })
  listId: number;

  @IsNumber()
  @IsNotEmpty({ message: '이동할 위치를 입력해주세요.' })
  newPosition: number;
}
