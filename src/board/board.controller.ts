import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Query, UseInterceptors } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { get } from 'http';
import { date } from 'joi';
// import { FaviconMiddleware } from 'src/middleware/favicon.middleware';

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  /** 보드 생성 */
  @Post('/')
  async create(@Body() createBoardDto: CreateBoardDto) {
    const board = await this.boardService.create(createBoardDto);
    return {
      status: HttpStatus.CREATED,
      message: '보드 생성에 성공했습니다.',
      board,
    };
  }

  @Get()
  findAll() {
    return this.boardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardService.update(+id, updateBoardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boardService.remove(+id);
  }

  @Post(':boardId/invite')
  async sendVerificationEmail(@Param('boardId') boardId: number, @Body('email') email: string) {
    const token = await this.boardService.sendVerificationEmail(boardId, email);
    console.log(token);
    return {
      message: '초대 링크가 전송되었습니다.',
      token,
    };
  }

  @Get(':boardId/accept-invitation')
  async accpetInvitation(@Param('boardId') boardId: number, @Query('token') token: string) {
    const invitedUserId = await this.boardService.accpetInvitation(boardId, token);
    return {
      message: `#${boardId} 보드에 초대되었습니다.`,
      data: { invitedUserId },
    };
  }
}
