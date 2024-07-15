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
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Controller('lists')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Post()
  async create(@Body() createListDto: CreateListDto) {
    const createdList = await this.listService.create(createListDto);
    return {
      status: HttpStatus.CREATED,
      message: '리스트 생성에 성공했습니다.',
      data: createdList,
    };
  }

  @Patch(':listId')
  async update(@Param('listId', ParseIntPipe) listId: number, @Body() updateListDto: UpdateListDto) {
    const updatedList = await this.listService.update(listId, updateListDto);
    return {
      status: HttpStatus.OK,
      message: '리스트 업데이트에 성공했습니다.',
      data: updatedList,
    };
  }

  @Patch(':listId/move')
  async move(@Param('listId', ParseIntPipe) listId: number, @Body() moveListDto: MoveListDto) {
    const movedList = await this.listService.move(listId, moveListDto);
    return {
      status: HttpStatus.OK,
      message: '리스트 이동에 성공했습니다.',
      data: movedList,
    };
  }

  @Delete(':listId')
  async remove(@Param('listId', ParseIntPipe) listId: number) {
    const deletedList = await this.listService.remove(listId);
    return {
      status: HttpStatus.OK,
      message: '해당 리스트를 삭제했습니다.',
      data: deletedList,
    };
  }

  @Get()
  async findAll(@Query('boardId') boardId: number) {
    const lists = await this.listService.findAll(boardId);
    return {
      status: HttpStatus.OK,
      message: '리스트 조회에 성공했습니다.',
      data: lists,
    };
  }
}
