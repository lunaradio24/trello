import { Controller, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ListService } from './list.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { MoveListDto } from './dto/move-list.dto';
import { List } from './entities/list.entity';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@Controller('lists')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async create(@Body() createListDto: CreateListDto): Promise<List> {
    return await this.listService.create(createListDto);
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  async update(@Param('id') id: string, @Body() updateListDto: UpdateListDto): Promise<List> {
    return this.listService.update(+id, updateListDto);
  }

  @Patch(':id/move')
  @UseGuards(AccessTokenGuard)
  async move(@Param('id') id: string, @Body() moveListDto: MoveListDto): Promise<List> {
    return this.listService.move(+id, moveListDto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  async remove(@Param('id') id: string): Promise<void> {
    return this.listService.remove(+id);
  }
}
