import { PickType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Comment } from '../entities/comment.entity';

export class CreateCommentDto extends PickType(Comment, ['cardId', 'content']) {
  /**
   * 카드 ID
   * @example 1
   */
  @IsInt()
  @IsNotEmpty()
  cardId: number;

  /**
   * 댓글 내용
   * @example "댓글 내용"
   */
  @IsString()
  @IsNotEmpty()
  content: string;
}
