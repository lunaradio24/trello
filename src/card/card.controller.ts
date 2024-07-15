import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { MoveCardDto } from './dto/move-card.dto';

@Controller('card')
@UseGuards(AccessTokenGuard)
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  async createCard(@Body() createCardDto: CreateCardDto) {
    const card = await this.cardService.createCard(createCardDto);
    return {
      status: HttpStatus.OK,
      message: '카드 생성에 성공했습니다.',
      data: card,
    };
  }

  @Get(':cardId')
  async getCardById(@Param('cardId', ParseIntPipe) cardId: number) {
    const getCard = await this.cardService.getCardById(cardId);
    return {
      status: HttpStatus.OK,
      message: '카드 상세 조회에 성공했습니다.',
      data: getCard,
    };
  }

  @Patch(':cardId')
  async updateCardById(@Param('cardId', ParseIntPipe) cardId: number, @Body() updateCardDto: UpdateCardDto) {
    const updateCard = await this.cardService.updateCardById(cardId, updateCardDto);
    return {
      status: HttpStatus.OK,
      message: '카드 수정에 성공했습니다.',
      data: updateCard,
    };
  }

  @Put(':cardId/move')
  async moveCardById(@Param('cardId', ParseIntPipe) cardId: number, @Body() moveCardDto: MoveCardDto) {
    const moveCard = await this.cardService.moveCardById(cardId, moveCardDto);
    return {
      status: HttpStatus.OK,
      message: '카드 이동에 성공했습니다.',
      data: moveCard,
    };
  }

  @Delete(':cardId')
  async removeCardById(@Param('cardId', ParseIntPipe) cardId: number) {
    const removeCard = await this.cardService.removeCardById(cardId);
    return {
      status: HttpStatus.OK,
      message: '카드 삭제에 성공했습니다.',
      data: removeCard,
    };
  }
}
