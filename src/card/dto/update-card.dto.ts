import { PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  readonly title: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsString()
  @IsOptional()
  readonly color?: string;

  @IsDate()
  @IsOptional()
  readonly due_date?: Date;

  @IsString()
  @IsOptional()
  assigneeId?: number[];
}
