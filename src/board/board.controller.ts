import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Req,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { ListService } from '../list/list.service';
import { CardService } from '../card/card.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InviteBoardDto } from './dto/invite-board.dto';

@ApiTags('Boards')
@Controller('boards')
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly listService: ListService,
    private readonly cardService: CardService,
  ) {}

  /** 보드 생성 */
  @Post()
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async create(@Body() createBoardDto: CreateBoardDto, @Req() req: any) {
    // userId로 adminId 지정
    const userId = Number(req.user.id);
    const board = await this.boardService.create(userId, createBoardDto);
    return {
      status: HttpStatus.CREATED,
      message: '보드 생성에 성공했습니다.',
      data: board,
    };
  }

  /** 내가 속한 보드 목록 조회 */
  @Get('joined')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async findAll(@Req() req: any) {
    const userId = Number(req.user.id);
    const boards = await this.boardService.findAll(userId);
    return {
      status: HttpStatus.OK,
      message: '보드 목록 조회에 성공했습니다.',
      data: boards,
    };
  }

  /** 보드 상세 조회 */
  @Get(':boardId')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async findOne(@Param('boardId', ParseIntPipe) boardId: number, @Req() req: any) {
    const userId = Number(req.user.id);
    const board = await this.boardService.findOne(boardId, userId);

    return {
      status: HttpStatus.OK,
      message: '보드 상세 조회에 성공했습니다.',
      data: board,
    };
  }

  /** 보드 수정 */
  @Patch(':boardId')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async update(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Req() req: any,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    const userId = Number(req.user.id);
    const { title, backgroundColor } = updateBoardDto;
    const updatedBoard = await this.boardService.update(boardId, userId, updateBoardDto);
    return {
      status: HttpStatus.OK,
      message: '보드 수정에 성공했습니다.',
      data: updatedBoard,
    };
  }

  /** 보드 삭제 */
  @Delete(':boardId')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async remove(@Param('boardId', ParseIntPipe) boardId: number, @Req() req: any) {
    // board 삭제 시 lists와 cards 함께 삭제 필요
    const userId = Number(req.user.id);
    const deletedBoard = await this.boardService.delete(boardId, userId);
    return {
      status: HttpStatus.OK,
      message: '보드 삭제에 성공했습니다.',
      data: deletedBoard,
    };
  }

  /** 보드 초대 링크 발송 */
  @Post(':boardId/invite')
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async sendVerificationEmail(
    @Param('boardId') boardId: number,
    @Body() inviteBoardDto: InviteBoardDto,
    @Req() req: any,
  ) {
    const userId = req.user.id; //JWT토큰 에서 추출
    const token = await this.boardService.sendVerificationEmail(boardId, inviteBoardDto.email, userId);
    console.log(token);
    return {
      message: '초대 링크가 전송되었습니다.',
      data: token,
    };
  }

  /** 보드 초대 수락 */
  @Get(':boardId/invite')
  async acceptInvitation(@Param('boardId') boardId: number, @Query('token') token: string) {
    const invitedUserId = await this.boardService.acceptInvitation(boardId, token);
    return {
      message: `#${boardId} 보드에 초대되었습니다.`,
      data: { invitedUserId },
    };
  }
}
