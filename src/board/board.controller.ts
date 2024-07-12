import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Query } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { EmailService } from 'src/email/email.service';

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

  @Post(':id/invite')
  async sendVerificationEmail(@Param('id') id: number, @Body('boardId') boardId: number, @Body('email') email: string) {
    const token = await this.boardService.sendVerificationEmail(id, boardId, email);
    console.log(token);
    return {
      message: '초대 링크가 전송되었습니다.',
      token,
    };
  }

  @Post('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const email = await this.boardService.verifyEmailToken(token);
    console.log(email);
    return {
      message: '이메일 인증 성공!',
    };

    // 유효한 토큰인 경우 추가 로직 수행 (예: 사용자 이메일 검증 상태 업데이트)
  }
}
