import { PickType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Comment } from '../entities/comment.entity';

export class CommentDto extends PickType(Comment, ['cardId', 'content']) {
  @IsInt()
  @IsNotEmpty()
  readonly cardId: number;

  @IsString()
  @IsNotEmpty()
  readonly content: string;
}
