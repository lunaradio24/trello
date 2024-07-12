import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsNotEmpty({ message: '보드명을 입력해주세요.' })
  @IsString()
  title: string;

  @IsHexColor()
  backgroundColor: string;
}
