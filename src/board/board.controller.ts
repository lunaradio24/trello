import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Req, Query, UseGuards } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { ListService } from 'src/list/list.service';
import { CardService } from 'src/card/card.service';
import { EmailService } from 'src/email/email.service';

@Controller('boards')
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly listService: ListService,
    private readonly cardService: CardService,
  ) {}

  /** 보드 생성 */
  @UseGuards(AccessTokenGuard)
  @Post('/')
  async create(@Body() createBoardDto: CreateBoardDto, @Req() req: any) {
    // userId로 adminId 지정
    const userId = Number(req.user.id);
    const board = await this.boardService.create(userId, createBoardDto);
    return {
      status: HttpStatus.CREATED,
      message: '보드 생성에 성공했습니다.',
      board,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Get('/')
  async findAll(@Req() req: any) {
    const boards = await this.boardService.findAll();
    return {
      status: HttpStatus.OK,
      message: '보드 목록 조회에 성공했습니다.',
      boards,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const board = await this.boardService.findOne(+id);
    // boardId가 포함된 lists 불러오기
    const lists = await this.listService.findAll(+id);
    console.log(lists);
    // listId가 포함된 cards 불러오기
    const cardsOfLists = await Promise.all(
      lists.map(async (list) => {
        const cards = await this.cardService.findAll(list.id);
        return cards;
      }),
    );
    return {
      status: HttpStatus.OK,
      message: '보드 상세 조회에 성공했습니다.',
      board,
      lists: cardsOfLists,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Req() req: any, @Body() updateBoardDto: UpdateBoardDto) {
    const userId = Number(req.user.id);
    const { title, backgroundColor } = updateBoardDto;
    const updatedBoard = await this.boardService.update(+id, userId, updateBoardDto);
    return {
      status: HttpStatus.OK,
      message: '보드 수정에 성공했습니다.',
      updatedBoard,
    };
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    // board 삭제 시 lists와 cards 함께 삭제 필요
    const userId = Number(req.user.id);
    const delededBoard = await this.boardService.delete(+id, userId);
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
