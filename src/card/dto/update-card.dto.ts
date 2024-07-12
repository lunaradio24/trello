import { PartialType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';

export class UpdateCardDto extends PartialType(CreateCardDto) {
    description?: string;
    color?: string;
    due_date?: Date;
    assigneeId?: number[];
  }