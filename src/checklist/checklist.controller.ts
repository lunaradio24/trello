import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Checklists')
@Controller('checklist')
@UseGuards(AccessTokenGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Post()
  async create(@Body() createChecklistDto: CreateChecklistDto) {
    const createdChecklist = await this.checklistService.create(createChecklistDto);
    return {
      status: HttpStatus.CREATED,
      message: '체크리스트 등록에 성공했습니다.',
      data: createdChecklist,
    };
  }

  @Get()
  async getList(@Query('cardId', ParseIntPipe) cardId: number) {
    const checklists = await this.checklistService.getListByCardId(cardId);
    return {
      status: HttpStatus.OK,
      message: '체크리스트 목록 조회에 성공했습니다.',
      data: checklists,
    };
  }

  @Post(':checklistId/check')
  async check(@Param('checklistId', ParseIntPipe) checklistId: number) {
    const { checkedAt } = await this.checklistService.check(checklistId);
    return {
      status: HttpStatus.OK,
      message: '체크리스트 checked 처리에 성공했습니다.',
      data: { id: checklistId, checkedAt },
    };
  }

  @Post(':checklistId/uncheck')
  async uncheck(@Param('checklistId', ParseIntPipe) checklistId: number) {
    const { uncheckedAt } = await this.checklistService.uncheck(checklistId);
    return {
      status: HttpStatus.OK,
      message: '체크리스트 unchecked 처리에 성공했습니다.',
      data: { id: checklistId, uncheckedAt },
    };
  }

  @Patch(':checklistId')
  async update(
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ) {
    const updatedChecklist = await this.checklistService.update(checklistId, updateChecklistDto);
    return {
      status: HttpStatus.OK,
      message: '체크리스트 수정에 성공했습니다.',
      data: updatedChecklist,
    };
  }

  @Delete(':checklistId')
  async delete(@Param('checklistId', ParseIntPipe) checklistId: number) {
    await this.checklistService.delete(checklistId);
    const { deletedAt } = await this.checklistService.getOneByChecklistId(checklistId);
    return {
      status: HttpStatus.OK,
      message: '체크리스트 삭제에 성공했습니다.',
      data: { id: checklistId, deletedAt },
    };
  }
}
