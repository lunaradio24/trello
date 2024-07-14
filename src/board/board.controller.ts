import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Req, Query } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { EmailService } from 'src/email/email.service';

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  /** 보드 생성 */
  @Post('/')
  async create(@Body() createBoardDto: CreateBoardDto, @Req() req: any) {
    // userId로 adminId 지정 필요
    // const userId = num(req.user.id)
    const board = await this.boardService.create(createBoardDto);
    return {
      status: HttpStatus.CREATED,
      message: '보드 생성에 성공했습니다.',
      board,
    };
  }

  @Get('/')
  async findAll(@Req() req: any) {
    // userId에 맞는 boards 찾기 필요
    // const userId = req.user.id;
    const boards = await this.boardService.findAll();
    return {
      status: HttpStatus.OK,
      message: '보드 목록 조회에 성공했습니다.',
      boards,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // lists와 cards 모두 출력되도록 변경 필요
    const board = await this.boardService.findOne(+id);
    return {
      status: HttpStatus.OK,
      message: '보드 상세 조회에 성공했습니다.',
      board,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    // 수정 권한에 대해 생각 필요
    const { title, backgroundColor } = updateBoardDto;
    const updatedBoard = await this.boardService.update(+id, updateBoardDto);
    return {
      status: HttpStatus.OK,
      message: '보드 수정에 성공했습니다.',
      updatedBoard,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // 삭제 권한에 대해 생각 필요
    // board 삭제 시 lists와 cards 함께 삭제 필요
    const delededBoard = await this.boardService.delete(+id);
    return {
      status: HttpStatus.OK,
      message: '보드 삭제에 성공했습니다.',
    };
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
