import { PartialType } from '@nestjs/swagger';
import { CreateCardDto } from './create-card.dto';
import { IsDate, IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCardDto extends PartialType(CreateCardDto) {
  /**
   * 카드명
   * @example "카드 이름"
   */
  @IsString()
  @IsOptional({ message: '제목을 입력해주세요.' })
  readonly title?: string;

  /**
   * 카드 설명
   * @example "카드 설명"
   */
  @IsString()
  @IsOptional()
  readonly description?: string;

  /**
   * 카드 색상
   * @example "#fc0fc0"
   */
  @IsHexColor()
  @IsOptional()
  readonly color?: string;

  /**
   * 마감일
   * @example "2024-07-17T12:00:00.000Z"
   */
  @IsDate()
  @IsOptional()
  readonly dueDate?: Date;
}
