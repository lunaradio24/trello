import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateListDto {
  @IsOptional()
  @IsNumber()
  @IsNotEmpty({ message: '보드의 ID를 입력해주세요.' })
  boardId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  title?: string;
}
