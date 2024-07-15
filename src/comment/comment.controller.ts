import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentDto } from './dto/comment.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Comments')
@Controller('comments')
@UseGuards(AccessTokenGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /** 댓글 생성 */
  @Post()
  async create(@Request() req: any, @Body() commentDto: CommentDto) {
    const { id: userId } = req.user;
    const createdComment = await this.commentService.create(userId, commentDto);
    return {
      status: HttpStatus.CREATED,
      message: '댓글 등록에 성공했습니다.',
      data: createdComment,
    };
  }

  /** 댓글 목록 조회 */
  @Get()
  async getListByCardId(@Query('cardId', ParseIntPipe) cardId: number) {
    const commentList = await this.commentService.getListByCardId(cardId);
    return {
      status: HttpStatus.OK,
      message: '댓글 목록 조회에 성공했습니다.',
      data: commentList,
    };
  }

  /** 내 댓글 목록 조회 */
  @Get('my')
  async getListByCommenterId(@Request() req: any) {
    const myCommentList = await this.commentService.getListByCommenterId(req.user.id);
    return {
      status: HttpStatus.OK,
      message: '내 댓글 목록 조회에 성공했습니다.',
      data: myCommentList,
    };
  }

  @Patch(':commentId')
  async update(
    @Request() req: any,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() commentDto: CommentDto,
  ) {
    const { id: userId } = req.user;
    const updatedComment = await this.commentService.update(userId, commentId, commentDto);
    return {
      status: HttpStatus.OK,
      message: '댓글 수정에 성공했습니다.',
      data: updatedComment,
    };
  }

  @Delete(':commentId')
  async delete(@Request() req: any, @Param('commentId', ParseIntPipe) commentId: number, @Body() cardId: number) {
    const { id: userId } = req.user;
    const { deletedAt } = await this.commentService.delete(userId, commentId, cardId);
    return {
      status: HttpStatus.OK,
      message: '댓글 삭제에 성공했습니다.',
      data: { id: commentId, deletedAt },
    };
  }
}
