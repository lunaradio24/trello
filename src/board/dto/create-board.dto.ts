import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @IsOptional()
  adminId: number;

  @IsNotEmpty({ message: '보드명을 입력해주세요.' })
  @IsString()
  title: string;

  @IsHexColor()
  backgroundColor: string;

  @IsNotEmpty({ message: '보드 설명을 입력해주세요.' })
  @IsString()
  description: string;
}
