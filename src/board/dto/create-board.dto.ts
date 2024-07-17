import { PickType } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Board } from '../entities/board.entity';

export class CreateBoardDto {
  /**
   * 보드명
   * @example "보드 이름"
   */
  @IsNotEmpty({ message: '보드명을 입력해주세요.' })
  @IsString()
  title: string;

  /**
   * 보드 설명
   * @example "보드 설명"
   */
  @IsNotEmpty({ message: '보드 설명을 입력해주세요.' })
  @IsString()
  description: string;

  /**
   * 보드 배경 색상
   * @example "#946f7c"
   */
  @IsOptional()
  @IsHexColor()
  backgroundColor: string;
}
