import { PickType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Card } from '../entities/card.entity';

export class CreateCardDto extends PickType(Card, ['listId', 'title']) {
  /**
   * 리스트 ID
   * @example 1
   */
  @IsInt()
  @IsNotEmpty()
  readonly listId: number;

  /**
   * 카드명
   * @example "카드 이름"
   */
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  readonly title: string;
}
