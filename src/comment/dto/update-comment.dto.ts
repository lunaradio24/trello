import { PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';

export class UpdateCommentDto extends PickType(CreateCommentDto, ['content']) {
  /**
   * 댓글 내용
   * @example "댓글 내용"
   */
  @IsString()
  @IsNotEmpty()
  content: string;
}
