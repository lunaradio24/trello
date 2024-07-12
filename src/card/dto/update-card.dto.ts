import { PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  readonly title: string;

  @IsString()
  readonly description?: string;

  @IsString()
  readonly color?: string;

  @IsDate()
  readonly due_date?: Date;

  @IsString()
  assigneeId?: number[];
}
