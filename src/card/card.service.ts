import { Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardService {
  createCard(createCardDto: CreateCardDto) {
    return 'This action adds a new card';
  }

  findCardById(id: number) {
    return `This action returns a #${id} card`;
  }

  updateCardById(id: number, updateCardDto: UpdateCardDto) {
    return `This action updates a #${id} card`;
  }

  // moveCardById(id: number) {
  //   return `This action returns a #${id} card`;
  // }

  removeCardById(id: number) {
    return `This action removes a #${id} card`;
  }
}
