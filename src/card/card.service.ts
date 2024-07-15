import { Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
  ) {}

  async createCard(createCardDto: CreateCardDto): Promise<Card> {
    //const { title } = createCardDto;

    const card = this.cardRepository.create({
      //title,
    } as DeepPartial<Card>);

    const savedCard = await this.cardRepository.save(card);

    return this.cardRepository.create({
      card_id: card.id,
      title: card.title,
    } as DeepPartial<Card>);
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
