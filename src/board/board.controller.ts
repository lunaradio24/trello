import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

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
    // lists와 cards 모두 출력되도록 변경 필요
    const board = await this.boardService.findOne(+id);
    return {
      status: HttpStatus.OK,
      message: '보드 상세 조회에 성공했습니다.',
      board,
    };
  }

  @UseGuards(AccessTokenGuard)
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

  @UseGuards(AccessTokenGuard)
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
}
