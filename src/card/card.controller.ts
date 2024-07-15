import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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
    return this.cardService.createCard(createCardDto);
  }

  @Get(':id')
  async getCardById(@Param('id') id: number) {
    return this.cardService.getCardById(+id);
  }

  @Patch(':id')
  async updateCardById(@Param('id') id: number, @Body() updateCardDto: UpdateCardDto) {
    return this.cardService.updateCardById(+id, updateCardDto);
  }

  @Patch(':id/move')
  async moveCardById(@Param('id') id: number, @Body() moveCardDto: MoveCardDto) {
    return this.cardService.moveCardById(+id, moveCardDto);
  }

  @Delete(':id')
  async removeCardById(@Param('id') id: number) {
    return this.cardService.removeCardById(+id);
  }
}
