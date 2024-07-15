import { OmitType } from '@nestjs/mapped-types';
import { CreateChecklistDto } from './create-checklist.dto';

export class UpdateChecklistDto extends OmitType(CreateChecklistDto, ['cardId']) {}
