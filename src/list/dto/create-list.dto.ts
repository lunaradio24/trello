import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateListDto {
  @IsNumber()
  @IsNotEmpty({ message: '보드의 Id를 입력해주세요.' })
  boardId: number;

  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  title: string;
}
