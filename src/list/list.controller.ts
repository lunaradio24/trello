import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Get,
  Query,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { ListService } from './list.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { MoveListDto } from './dto/move-list.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Lists')
@Controller('lists')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
export class ListController {
  constructor(private readonly listService: ListService) {}

  /** 리스트 생성 */
  @Post()
  async create(@Body() createListDto: CreateListDto) {
    const createdList = await this.listService.create(createListDto);
    return {
      status: HttpStatus.CREATED,
      message: '리스트 생성에 성공했습니다.',
      data: createdList,
    };
  }

  /** 리스트 목록 조회 */
  @Get()
  async findAll(@Query('boardId', ParseIntPipe) boardId: number) {
    const lists = await this.listService.findAll(boardId);
    return {
      status: HttpStatus.OK,
      message: '리스트 조회에 성공했습니다.',
      data: lists,
    };
  }

  /** 리스트 수정 */
  @Patch(':listId')
  async update(@Param('listId', ParseIntPipe) listId: number, @Body() updateListDto: UpdateListDto) {
    const { boardId } = updateListDto;
    const updatedList = await this.listService.update(boardId, listId, updateListDto);
    return {
      status: HttpStatus.OK,
      message: '리스트 업데이트에 성공했습니다.',
      data: updatedList,
    };
  }

  /** 리스트 이동 */
  @Patch(':listId/move')
  async move(@Param('listId', ParseIntPipe) listId: number, @Body() moveListDto: MoveListDto) {
    const movedList = await this.listService.move(listId, moveListDto);
    return {
      status: HttpStatus.OK,
      message: '리스트 이동에 성공했습니다.',
      data: movedList,
    };
  }

  /** 리스트 삭제 */
  @Delete(':listId')
  async remove(@Param('listId', ParseIntPipe) listId: number, @Body('boardId', ParseIntPipe) boardId: number) {
    const deletedList = await this.listService.remove(boardId, listId);
    return {
      status: HttpStatus.OK,
      message: '해당 리스트를 삭제했습니다.',
      data: deletedList,
    };
  }
}
