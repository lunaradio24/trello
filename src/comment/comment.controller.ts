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
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentDto } from './dto/comment.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@Controller('comments')
@UseGuards(AccessTokenGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(@Request() req: any, @Body() commentDto: CommentDto) {
    const { id: userId } = req.user;
    return this.commentService.create(userId, commentDto);
  }

  @Get()
  getListByCardId(@Query('cardId', ParseIntPipe) cardId: number) {
    return this.commentService.getListByCardId(cardId);
  }

  @Get('my')
  getListByCommenterId(@Request() req: any) {
    return this.commentService.getListByCommenterId(req.user.id);
  }

  @Patch(':commentId')
  update(@Request() req: any, @Param('commentId', ParseIntPipe) commentId: number, @Body() commentDto: CommentDto) {
    const { id: userId } = req.user;
    return this.commentService.update(userId, commentId, commentDto);
  }

  @Delete(':commentId')
  remove(@Request() req: any, @Param('commentId', ParseIntPipe) commentId: number, @Body() cardId: number) {
    const { id: userId } = req.user;
    return this.commentService.remove(userId, commentId, cardId);
  }
}
