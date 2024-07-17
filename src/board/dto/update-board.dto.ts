import { PartialType } from '@nestjs/swagger';
import { CreateBoardDto } from './create-board.dto';
import { IsHexColor, IsOptional, IsString } from 'class-validator';

export class UpdateBoardDto extends PartialType(CreateBoardDto) {
  /**
   * 보드명
   * @example "보드 이름"
   */
  @IsOptional()
  @IsString()
  title: string;

  /**
   * 보드 설명
   * @example "보드 설명"
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 보드 배경 색상
   * @example "#946f7c"
   */
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;
}
