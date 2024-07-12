import { Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { List } from 'src/list/entities/list.entity';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
  ) {}

  async createCard(createCardDto: CreateCardDto, user: User): Promise<Card> {
    const { title, list_id } = createCardDto;
    const list = await this.cardRepository.findOne({ where: { id: list_id } });

    if (!list) {
      throw new Error('해당 리스트가 없습니다.');
    }

    const card = this.cardRepository.create({
      user_id: user.id,
      list_id: list.id,
      title: title,
    });

    return this.cardRepository.save(card);
  }

  async findCardById(id: number): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id },
      relations: [''],
    });
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
