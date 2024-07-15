import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MoveCardDto {
  @IsNumber()
  @IsNotEmpty({ message: '대상 리스트를 선택해주세요.' })
  listId: number;

  @IsNumber()
  @IsOptional()
  targetCardId?: number;

  @IsString()
  @IsNotEmpty({ message: '위치를 입력해주세요.' })
  position: 'before' | 'after';
}
