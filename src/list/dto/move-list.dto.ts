import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MoveListDto {
  @IsNumber()
  @IsNotEmpty({ message: '보드의 ID를 입력해주세요.' })
  boardId: number;

  @IsNumber()
  @IsOptional()
  targetListId?: number;

  @IsString()
  @IsNotEmpty({ message: '위치를 입력해주세요.' })
  position: 'before' | 'after';
}
