import { PickType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Comment } from '../entities/comment.entity';

export class CommentDto extends PickType(Comment, ['cardId', 'content']) {
  /**
   * 댓글 내용
   * @example "댓글 내용"
   */
  @IsString()
  @IsNotEmpty()
  readonly content: string;
}
