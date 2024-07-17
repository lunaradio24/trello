import { OmitType } from '@nestjs/swagger';
import { CreateChecklistDto } from './create-checklist.dto';

export class UpdateChecklistDto extends OmitType(CreateChecklistDto, ['cardId']) {}
