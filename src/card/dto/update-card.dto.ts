import { IsDate, IsHexColor, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCardDto {
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
  @IsDate({ message: '데이트 타입으로 입력해주세요.' })
  @IsOptional()
  @Type(() => Date)
  readonly dueDate?: Date;
}
